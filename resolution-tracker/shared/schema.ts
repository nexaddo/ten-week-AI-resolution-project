import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import users table first
import { users, sessions } from "./models/auth";

// Re-export auth models
export { users, sessions };
export type { User, UpsertUser } from "./models/auth";

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
export const resolutions = pgTable("resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull().default("not_started"),
  targetDate: text("target_date"),
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
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resolutionId: varchar("resolution_id").notNull().references(() => resolutions.id),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  targetDate: text("target_date"),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

// Check-in schema for progress updates
export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resolutionId: varchar("resolution_id").notNull().references(() => resolutions.id),
  note: text("note").notNull(),
  date: text("date").notNull(),
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
