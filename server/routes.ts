import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { lessons, questions, userProgress, codingExercises } from "@db/schema";
import { eq, and } from "drizzle-orm";

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

    // Fetch both questions and coding exercises
    const [lessonQuestions, lessonExercises] = await Promise.all([
      db.select().from(questions).where(eq(questions.lessonId, lessonId)),
      db.select().from(codingExercises).where(eq(codingExercises.lessonId, lessonId))
    ]);

    // Return content based on lesson type
    const content = lesson.type === 'quiz' ? lessonQuestions : lessonExercises;
    res.json({ ...lesson, questions: lessonQuestions, codingExercises: lessonExercises });
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