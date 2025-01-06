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
  modulePrerequisites 
} from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

  const httpServer = createServer(app);
  return httpServer;
}