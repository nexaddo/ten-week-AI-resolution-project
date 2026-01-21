import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

// Use case categories (from screenshots)
export const useCaseCategories = [
  "Strategic Analysis",
  "Writing",
  "Visual Design",
  "Code",
  "Automation",
  "Audio/Video",
  "Research",
  "Other",
] as const;

export type UseCaseCategory = (typeof useCaseCategories)[number];

// AI Models - master list of available models
export const aiModels = pgTable("ai_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // anthropic, openai, google, etc.
  modelId: text("model_id").notNull(), // e.g., claude-3-opus, gpt-4, gemini-pro
  description: text("description"),
  capabilities: jsonb("capabilities").$type<string[]>(), // e.g., ["text", "code", "vision"]
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiModelSchema = createInsertSchema(aiModels).omit({
  id: true,
  createdAt: true,
});

export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type AiModel = typeof aiModels.$inferSelect;

// AI Tools - external tools/platforms (Cursor, v0, etc.)
export const aiTools = pgTable("ai_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  description: text("description"),
  url: text("url"),
  category: text("category"), // IDE, Code Gen, Design, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiToolSchema = createInsertSchema(aiTools).omit({
  id: true,
  createdAt: true,
});

export type InsertAiTool = z.infer<typeof insertAiToolSchema>;
export type AiTool = typeof aiTools.$inferSelect;

// User's personal model list - models they're tracking
export const userModels = pgTable("user_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  modelId: varchar("model_id").notNull().references(() => aiModels.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserModelSchema = createInsertSchema(userModels).omit({
  id: true,
  createdAt: true,
});

export type InsertUserModel = z.infer<typeof insertUserModelSchema>;
export type UserModel = typeof userModels.$inferSelect;

// User's personal tool list - tools they're tracking
export const userTools = pgTable("user_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  toolId: varchar("tool_id").notNull().references(() => aiTools.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserToolSchema = createInsertSchema(userTools).omit({
  id: true,
  createdAt: true,
});

export type InsertUserTool = z.infer<typeof insertUserToolSchema>;
export type UserTool = typeof userTools.$inferSelect;

// Use Cases - curated and community prompts for testing
export const useCases = pgTable("use_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  variables: jsonb("variables").$type<string[]>(), // placeholders in prompt like [PASTE_EMAIL_THREAD]
  isCurated: boolean("is_curated").notNull().default(false), // AIDB starter vs community
  authorId: varchar("author_id").references(() => users.id), // null for curated
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUseCaseSchema = createInsertSchema(useCases)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    category: z.enum(useCaseCategories),
  });

export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UseCase = typeof useCases.$inferSelect;

// User's saved use cases (favorites/bookmarks)
export const userUseCases = pgTable("user_use_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  useCaseId: varchar("use_case_id").notNull().references(() => useCases.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserUseCaseSchema = createInsertSchema(userUseCases).omit({
  id: true,
  createdAt: true,
});

export type InsertUserUseCase = z.infer<typeof insertUserUseCaseSchema>;
export type UserUseCase = typeof userUseCases.$inferSelect;

// Model Tests - run a use case against specific models
export const modelTests = pgTable("model_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  useCaseId: varchar("use_case_id").references(() => useCases.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  status: text("status").notNull().default("pending"), // pending, running, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModelTestSchema = createInsertSchema(modelTests).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertModelTest = z.infer<typeof insertModelTestSchema>;
export type ModelTest = typeof modelTests.$inferSelect;

// Model Test Results - results from each model
export const modelTestResults = pgTable("model_test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => modelTests.id),
  modelId: varchar("model_id").notNull().references(() => aiModels.id),
  output: text("output"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  latencyMs: integer("latency_ms"),
  estimatedCost: text("estimated_cost"),
  status: text("status").notNull().default("pending"), // pending, running, success, error
  errorMessage: text("error_message"),
  userRating: integer("user_rating"), // 1-5 stars
  userNotes: text("user_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModelTestResultSchema = createInsertSchema(modelTestResults).omit({
  id: true,
  createdAt: true,
});

export type InsertModelTestResult = z.infer<typeof insertModelTestResultSchema>;
export type ModelTestResult = typeof modelTestResults.$inferSelect;

// Model Recommendations - user's personalized recommendations per use case
export const modelRecommendations = pgTable("model_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  recommendedModelId: varchar("recommended_model_id").notNull().references(() => aiModels.id),
  avgRating: integer("avg_rating"),
  totalTests: integer("total_tests").notNull().default(0),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertModelRecommendationSchema = createInsertSchema(modelRecommendations).omit({
  id: true,
  updatedAt: true,
});

export type InsertModelRecommendation = z.infer<typeof insertModelRecommendationSchema>;
export type ModelRecommendation = typeof modelRecommendations.$inferSelect;
