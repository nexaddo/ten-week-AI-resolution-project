import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import users table first
import { users, sessions, userRoles, type UserRole } from "./models/auth";

// Re-export auth models
export { users, sessions, userRoles };
export type { User, UpsertUser, UserRole } from "./models/auth";

// Categories for resolutions
export const categories = [
  "Health & Fitness",
  "Career",
  "Learning",
  "Finance",
  "Relationships",
  "Personal Growth",
] as const;

export type Category = (typeof categories)[number];

// Resolution status
export const statuses = ["not_started", "in_progress", "completed", "abandoned"] as const;
export type Status = (typeof statuses)[number];

// Resolution schema
// NOTE: targetDate uses text type for backward compatibility with existing data.
// Future migration should convert to timestamp type for better date handling.
export const resolutions = pgTable("resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull().default("not_started"),
  targetDate: text("target_date"), // TODO: Migrate to timestamp type
  progress: integer("progress").notNull().default(0),
});

export const insertResolutionSchema = createInsertSchema(resolutions)
  .omit({
    id: true,
    userId: true,
  })
  .extend({
    category: z.enum(categories),
    status: z.enum(statuses).optional(),
    progress: z.number().int().min(0).max(100).optional(),
  });

export type InsertResolution = z.infer<typeof insertResolutionSchema>;
export type Resolution = typeof resolutions.$inferSelect;

// Milestone schema
// NOTE: targetDate uses text type for backward compatibility with existing data.
// Future migration should convert to timestamp type for consistency.
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resolutionId: varchar("resolution_id").notNull().references(() => resolutions.id),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  targetDate: text("target_date"), // TODO: Migrate to timestamp type
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

// Check-in schema for progress updates
// NOTE: date uses text type for backward compatibility with existing data.
// Future migration should convert to timestamp type for consistency with other tables.
export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resolutionId: varchar("resolution_id").notNull().references(() => resolutions.id),
  note: text("note").notNull(),
  date: text("date").notNull(), // TODO: Migrate to timestamp type
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// AI Insights schema - stores AI-generated analysis
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checkInId: varchar("check_in_id").notNull().references(() => checkIns.id),
  modelName: text("model_name").notNull(),
  insight: text("insight").notNull(),
  suggestion: text("suggestion"),
  sentiment: text("sentiment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;

// AI Model Usage schema - tracks performance metrics for model comparison
export const aiModelUsage = pgTable("ai_model_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checkInId: varchar("check_in_id").notNull().references(() => checkIns.id),
  modelName: text("model_name").notNull(),
  provider: text("provider").notNull(),
  endpoint: text("endpoint").notNull(),
  promptTokens: integer("prompt_tokens").notNull(),
  completionTokens: integer("completion_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  estimatedCost: text("estimated_cost").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiModelUsageSchema = createInsertSchema(aiModelUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertAiModelUsage = z.infer<typeof insertAiModelUsageSchema>;
export type AiModelUsage = typeof aiModelUsage.$inferSelect;

// Prompt Templates - library of pre-defined use cases
export const useCaseCategories = [
  "writing",
  "research",
  "coding",
  "analysis",
  "creative",
  "education",
  "business",
  "general",
] as const;

export type UseCaseCategory = (typeof useCaseCategories)[number];

export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // UseCaseCategory
  systemPrompt: text("system_prompt"),
  examplePrompt: text("example_prompt").notNull(),
  suggestedModels: text("suggested_models"), // JSON array of model names
  tags: text("tags"), // JSON array of tags
  isPublic: boolean("is_public").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  createdAt: true,
}).extend({
  category: z.enum(useCaseCategories),
});

export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type PromptTemplate = typeof promptTemplates.$inferSelect;

// Prompt Test schema - for testing prompts across different models
export const promptTests = pgTable("prompt_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  category: text("category"), // e.g., "creative", "analytical", "code", "general"
  templateId: varchar("template_id").references(() => promptTemplates.id),
  tags: text("tags"), // JSON array of tags
  selectedModels: text("selected_models"), // JSON array of models to test
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromptTestSchema = createInsertSchema(promptTests).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertPromptTest = z.infer<typeof insertPromptTestSchema>;
export type PromptTest = typeof promptTests.$inferSelect;

// Prompt Test Results - stores outputs from each model
export const promptTestResults = pgTable("prompt_test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptTestId: varchar("prompt_test_id").notNull().references(() => promptTests.id),
  modelName: text("model_name").notNull(),
  provider: text("provider").notNull(),
  output: text("output").notNull(),
  promptTokens: integer("prompt_tokens").notNull(),
  completionTokens: integer("completion_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  estimatedCost: text("estimated_cost").notNull(),
  status: text("status").notNull(), // "success", "error"
  errorMessage: text("error_message"),
  userRating: integer("user_rating"), // 1-5 stars
  userComment: text("user_comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromptTestResultSchema = createInsertSchema(promptTestResults).omit({
  id: true,
  createdAt: true,
});

export type InsertPromptTestResult = z.infer<typeof insertPromptTestResultSchema>;
export type PromptTestResult = typeof promptTestResults.$inferSelect;

// Test Case Configurations - allows custom model and tool selection
export const testCaseConfigs = pgTable("test_case_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptTestId: varchar("prompt_test_id").notNull().references(() => promptTests.id),
  modelName: text("model_name").notNull(),
  provider: text("provider").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  customParameters: text("custom_parameters"), // JSON for model-specific params
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestCaseConfigSchema = createInsertSchema(testCaseConfigs).omit({
  id: true,
  createdAt: true,
});

export type InsertTestCaseConfig = z.infer<typeof insertTestCaseConfigSchema>;
export type TestCaseConfig = typeof testCaseConfigs.$inferSelect;

// User Favorites - for models and tools
export const favoriteTypes = ["model", "tool", "template"] as const;
export type FavoriteType = (typeof favoriteTypes)[number];

export const userFavorites = pgTable("user_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  favoriteType: text("favorite_type").notNull(), // FavoriteType
  favoriteId: text("favorite_id").notNull(), // model name, tool name, or template id
  favoriteName: text("favorite_name").notNull(),
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  createdAt: true,
}).extend({
  favoriteType: z.enum(favoriteTypes),
});

export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;

// Prompt use case types
export const promptUseCaseTypes = [
  "writing",
  "research",
  "coding",
  "analysis",
  "creative",
  "technical",
  "general",
] as const;
export type PromptUseCaseType = (typeof promptUseCaseTypes)[number];

// Test Case Templates - library of predefined prompt templates
export const testCaseTemplates = pgTable("test_case_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  useCaseType: text("use_case_type").notNull(), // writing, research, coding, etc.
  systemPrompt: text("system_prompt"),
  examplePrompt: text("example_prompt").notNull(),
  suggestedModels: text("suggested_models"), // JSON array of model names
  suggestedTools: text("suggested_tools"), // JSON array of tool names
  isBuiltIn: boolean("is_built_in").default(true).notNull(), // true for predefined, false for user-created
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // null for built-in templates
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestCaseTemplateSchema = createInsertSchema(testCaseTemplates).omit({
  id: true,
  createdAt: true,
}).extend({
  useCaseType: z.enum(promptUseCaseTypes),
});

export type InsertTestCaseTemplate = z.infer<typeof insertTestCaseTemplateSchema>;
export type TestCaseTemplate = typeof testCaseTemplates.$inferSelect;

// Test Case Configurations - specific model/tool selections for each test
export const testCaseConfigurations = pgTable("test_case_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptTestId: varchar("prompt_test_id")
    .notNull()
    .references(() => promptTests.id, { onDelete: "cascade" }),
  selectedModels: text("selected_models").notNull(), // JSON array of model names
  selectedTools: text("selected_tools"), // JSON array of tool identifiers
  templateId: varchar("template_id").references(() => testCaseTemplates.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestCaseConfigurationSchema = createInsertSchema(testCaseConfigurations).omit({
  id: true,
  createdAt: true,
});

export type InsertTestCaseConfiguration = z.infer<typeof insertTestCaseConfigurationSchema>;
export type TestCaseConfiguration = typeof testCaseConfigurations.$inferSelect;

// Model Favorites - user's favorite models
export const modelFavorites = pgTable("model_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelName: text("model_name").notNull(),
  provider: text("provider").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("model_favorites_user_model_provider_idx").on(table.userId, table.modelName, table.provider),
]);

export const insertModelFavoriteSchema = createInsertSchema(modelFavorites).omit({
  id: true,
  createdAt: true,
});

export type InsertModelFavorite = z.infer<typeof insertModelFavoriteSchema>;
export type ModelFavorite = typeof modelFavorites.$inferSelect;

// Tool Favorites - user's favorite tools
export const toolFavorites = pgTable("tool_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toolIdentifier: text("tool_identifier").notNull(), // e.g., "code_interpreter", "web_search"
  toolName: text("tool_name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tool_favorites_user_tool_idx").on(table.userId, table.toolIdentifier),
]);

export const insertToolFavoriteSchema = createInsertSchema(toolFavorites).omit({
  id: true,
  createdAt: true,
});

export type InsertToolFavorite = z.infer<typeof insertToolFavoriteSchema>;
export type ToolFavorite = typeof toolFavorites.$inferSelect;

// User Activity Log - tracks user actions for analytics
export const userActivityLog = pgTable("user_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // e.g., "resolution_created", "check_in_added", "milestone_completed"
  entityType: text("entity_type"), // e.g., "resolution", "milestone", "check_in"
  entityId: varchar("entity_id"), // ID of the related entity
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLog).omit({
  id: true,
  createdAt: true,
});

export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof userActivityLog.$inferSelect;

// API Performance Metrics - tracks response times and latency
export const apiMetrics = pgTable("api_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // nullable for unauthenticated requests
  endpoint: text("endpoint").notNull(), // e.g., "/api/resolutions"
  method: text("method").notNull(), // e.g., "GET", "POST"
  statusCode: integer("status_code").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertApiMetricsSchema = createInsertSchema(apiMetrics).omit({
  id: true,
  timestamp: true,
});

export type InsertApiMetrics = z.infer<typeof insertApiMetricsSchema>;
export type ApiMetrics = typeof apiMetrics.$inferSelect;

// Page Views - tracks frontend page navigation
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // nullable for unauthenticated views
  path: text("path").notNull(), // e.g., "/", "/resolutions", "/analytics"
  referrer: text("referrer"), // Previous page
  userAgent: text("user_agent"), // Browser/device info
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  timestamp: true,
});

export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;
