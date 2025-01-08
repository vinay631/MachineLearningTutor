import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  streak: integer("streak").default(0).notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: integer("difficulty").notNull(),
  order: integer("order").notNull(),
  module: text("module").notNull(),
  type: text("type").notNull().default('quiz'),
  prerequisites: text("prerequisites").default('[]'), // JSON array of lesson IDs
});

export const modulePrerequisites = pgTable("module_prerequisites", {
  id: serial("id").primaryKey(),
  moduleId: text("module_id").notNull(),
  prerequisiteModuleId: text("prerequisite_module_id").notNull(),
  required: boolean("required").default(true).notNull(),
});

export const lessonRecommendations = pgTable("lesson_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  score: integer("recommendation_score").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  score: integer("score").default(0).notNull(),
  lastAttempted: timestamp("last_attempted").defaultNow().notNull()
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull()
});

export const codingExercises = pgTable("coding_exercises", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  initialCode: text("initial_code").notNull(),
  solution: text("solution").notNull(),
  testCases: text("test_cases").notNull(),
  hints: text("hints").notNull(),
});

export const lessonRelations = relations(lessons, ({ many }) => ({
  questions: many(questions),
  codingExercises: many(codingExercises),
  recommendations: many(lessonRecommendations)
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const recommendationRelations = relations(lessonRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [lessonRecommendations.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonRecommendations.lessonId],
    references: [lessons.id],
  }),
}));

export const diagnosticQuiz = pgTable("diagnostic_quiz", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array of options
  correctAnswer: text("correct_answer").notNull(),
  difficultyLevel: integer("difficulty_level").notNull(),
  skillArea: text("skill_area").notNull(), // e.g., 'python', 'statistics', 'deep_learning'
  weight: integer("weight").default(1).notNull(), // Importance of this question in skill assessment
});

export const userDiagnosticResponses = pgTable("user_diagnostic_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: integer("quiz_id").references(() => diagnosticQuiz.id).notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTime: integer("response_time"), // Time taken to answer in seconds
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const userSkillLevels = pgTable("user_skill_levels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  skillArea: text("skill_area").notNull(),
  level: integer("level").notNull(), // 1-5 scale
  confidence: integer("confidence").notNull(), // 0-100 confidence in the assessment
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const diagnosticQuizRelations = relations(diagnosticQuiz, ({ many }) => ({
  responses: many(userDiagnosticResponses),
}));

export const userDiagnosticResponsesRelations = relations(userDiagnosticResponses, ({ one }) => ({
  user: one(users, {
    fields: [userDiagnosticResponses.userId],
    references: [users.id],
  }),
  quiz: one(diagnosticQuiz, {
    fields: [userDiagnosticResponses.quizId],
    references: [diagnosticQuiz.id],
  }),
}));

export const userSkillLevelsRelations = relations(userSkillLevels, ({ one }) => ({
  user: one(users, {
    fields: [userSkillLevels.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type CodingExercise = typeof codingExercises.$inferSelect;
export type LessonRecommendation = typeof lessonRecommendations.$inferSelect;
export type ModulePrerequisite = typeof modulePrerequisites.$inferSelect;
export type DiagnosticQuiz = typeof diagnosticQuiz.$inferSelect;
export type UserDiagnosticResponse = typeof userDiagnosticResponses.$inferSelect;
export type UserSkillLevel = typeof userSkillLevels.$inferSelect;