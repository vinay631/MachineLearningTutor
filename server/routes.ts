import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  lessons,
  questions,
  userProgress,
  codingExercises,
  lessonRecommendations,
  modulePrerequisites,
  diagnosticQuiz,
  userDiagnosticResponses,
  userSkillLevels
} from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function requireAuth(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/lessons", async (req, res) => {
    const allLessons = await db.query.lessons.findMany({
      orderBy: (lessons, { asc }) => [asc(lessons.order)]
    });
    res.json(allLessons);
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lessonId = parseInt(req.params.id);
    if (isNaN(lessonId)) {
      return res.status(400).send("Invalid lesson ID");
    }

    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) {
      return res.status(404).send("Lesson not found");
    }

    const [lessonQuestions, lessonExercises] = await Promise.all([
      db.select().from(questions).where(eq(questions.lessonId, lessonId)),
      db.select().from(codingExercises).where(eq(codingExercises.lessonId, lessonId))
    ]);

    const content = lesson.type === 'quiz' ? lessonQuestions : lessonExercises;
    res.json({ ...lesson, questions: lessonQuestions, codingExercises: lessonExercises });
  });

  app.get("/api/recommendations", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, req.user.id));

    const completedLessonIds = progress
      .filter(p => p.completed)
      .map(p => p.lessonId);

    const allLessons = await db
      .select()
      .from(lessons)
      .orderBy(lessons.order);

    const modulePrereqs = await db
      .select()
      .from(modulePrerequisites);

    const recommendations = [];
    for (const lesson of allLessons) {
      if (completedLessonIds.includes(lesson.id)) {
        continue;
      }

      const modulePrereq = modulePrereqs.find(
        mp => mp.moduleId === lesson.module
      );

      if (modulePrereq) {
        const prereqLessons = allLessons.filter(
          l => l.module === modulePrereq.prerequisiteModuleId
        );
        const prereqComplete = prereqLessons.every(
          l => completedLessonIds.includes(l.id)
        );
        if (!prereqComplete && modulePrereq.required) {
          continue;
        }
      }

      let score = 100;
      let reason = "This lesson matches your current skill level";

      const userAvgScore = progress.length > 0
        ? progress.reduce((sum, p) => sum + p.score, 0) / progress.length
        : 0;

      if (userAvgScore < 70 && lesson.difficulty > 1) {
        score -= 20;
        reason = "You might want to practice easier lessons first";
      } else if (userAvgScore > 90 && lesson.difficulty === 1) {
        score -= 10;
        reason = "You might find this lesson too easy";
      }

      const prerequisites = JSON.parse(lesson.prerequisites);
      const prereqsCompleted = prerequisites.every((id: number) =>
        completedLessonIds.includes(id)
      );

      if (!prereqsCompleted) {
        score -= 40;
        reason = "Complete prerequisite lessons first";
      }

      recommendations.push({
        lessonId: lesson.id,
        score,
        reason
      });
    }

    recommendations.sort((a, b) => b.score - a.score);

    const topRecommendations = recommendations.slice(0, 5);
    await db.insert(lessonRecommendations).values(
      topRecommendations.map(rec => ({
        userId: req.user!.id,
        lessonId: rec.lessonId,
        score: rec.score,
        reason: rec.reason,
        status: 'active'
      }))
    );

    const recommendedLessons = await Promise.all(
      topRecommendations.map(async rec => {
        const [lesson] = await db
          .select()
          .from(lessons)
          .where(eq(lessons.id, rec.lessonId))
          .limit(1);
        return {
          ...lesson,
          recommendationScore: rec.score,
          recommendationReason: rec.reason
        };
      })
    );

    res.json(recommendedLessons);
  });

  app.get("/api/progress", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, req.user.id));

    res.json(progress);
  });

  app.post("/api/progress/:lessonId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      return res.status(400).send("Invalid lesson ID");
    }

    const { score } = req.body;
    if (typeof score !== "number") {
      return res.status(400).send("Invalid score");
    }

    const [existing] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, req.user.id),
          eq(userProgress.lessonId, lessonId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(userProgress)
        .set({
          score: score > existing.score ? score : existing.score,
          completed: score >= 80,
          lastAttempted: new Date()
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        userId: req.user.id,
        lessonId,
        score,
        completed: score >= 80,
        lastAttempted: new Date()
      });
    }

    res.json({ message: "Progress updated" });
  });

  // Diagnostic Quiz Routes
  app.get("/api/diagnostic-quiz", requireAuth, async (req, res) => {
    try {
      const quizQuestions = await db
        .select()
        .from(diagnosticQuiz)
        .orderBy(sql`random()`)
        .limit(10);

      res.json(quizQuestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diagnostic quiz" });
    }
  });

  app.post("/api/diagnostic-quiz/submit", requireAuth, async (req, res) => {
    try {
      const { responses } = req.body;
      const userId = req.user!.id;

      // Process each response
      for (const response of responses) {
        const quiz = await db
          .select()
          .from(diagnosticQuiz)
          .where(eq(diagnosticQuiz.id, response.quizId))
          .limit(1);

        if (!quiz[0]) continue;

        const isCorrect = response.answer === quiz[0].correctAnswer;

        // Record response
        await db.insert(userDiagnosticResponses).values({
          userId,
          quizId: response.quizId,
          answer: response.answer,
          isCorrect,
          responseTime: response.responseTime,
        });

        // Update skill levels
        const [existingSkill] = await db
          .select()
          .from(userSkillLevels)
          .where(
            and(
              eq(userSkillLevels.userId, userId),
              eq(userSkillLevels.skillArea, quiz[0].skillArea)
            )
          )
          .limit(1);

        const skillScore = isCorrect ? quiz[0].weight : -quiz[0].weight;
        const newLevel = Math.max(1, Math.min(5,
          existingSkill ? existingSkill.level + skillScore : 3 + skillScore
        ));

        if (existingSkill) {
          await db
            .update(userSkillLevels)
            .set({
              level: newLevel,
              lastUpdated: new Date()
            })
            .where(eq(userSkillLevels.id, existingSkill.id));
        } else {
          await db.insert(userSkillLevels).values({
            userId,
            skillArea: quiz[0].skillArea,
            level: newLevel,
            confidence: 70,
          });
        }
      }

      // Update recommendations based on new skill levels
      const [userSkills] = await db
        .select()
        .from(userSkillLevels)
        .where(eq(userSkillLevels.userId, userId));

      // Clear existing recommendations
      await db
        .delete(lessonRecommendations)
        .where(eq(lessonRecommendations.userId, userId));

      // Generate new recommendations based on skill levels
      const allLessons = await db.select().from(lessons);
      const recommendations = allLessons
        .map(lesson => {
          let score = 100;
          const skillLevel = userSkills?.level || 3;

          // Adjust score based on skill level and lesson difficulty
          if (Math.abs(skillLevel - lesson.difficulty) > 1) {
            score -= 20 * Math.abs(skillLevel - lesson.difficulty);
          }

          return {
            lessonId: lesson.id,
            userId,
            score,
            reason: `Based on your skill assessment in ${lesson.module}`,
            status: 'active'
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      await db.insert(lessonRecommendations).values(recommendations);

      res.json({ message: "Quiz completed successfully" });
    } catch (error) {
      console.error("Error processing quiz submission:", error);
      res.status(500).json({ error: "Failed to process quiz submission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}