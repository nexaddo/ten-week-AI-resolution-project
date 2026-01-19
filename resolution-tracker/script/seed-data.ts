#!/usr/bin/env tsx
/**
 * Seed script to populate database with sample data for testing
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { resolutions, checkIns } from "../shared/schema.js";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool);

async function seedData() {
  console.log("🌱 Seeding database with sample data...\n");

  try {
    // Get user ID from environment or use development default
    const userId = process.env.SEED_USER_ID || process.env.DEV_USER_ID || "dev-user";

    if (!process.env.SEED_USER_ID && !process.env.DEV_USER_ID) {
      console.log("⚠️  No SEED_USER_ID or DEV_USER_ID set. Using default 'dev-user'");
      console.log("💡 To seed with a specific user, set SEED_USER_ID environment variable");
      console.log("   Example: SEED_USER_ID=github:12345 npm run seed\n");
    }

    console.log(`Using user ID: ${userId}\n`);

    // Create sample resolution
    const [resolution] = await db
      .insert(resolutions)
      .values({
        userId,
        title: "Complete 10 week AI New Year Bootcamp",
        description: "https://aidbnewyear.com/program",
        category: "Personal Growth",
        status: "in_progress",
        targetDate: "2026-04-05",
        progress: 20,
      })
      .returning();

    console.log("✅ Created resolution:", resolution.title);

    // Create check-ins
    const checkIn1 = await db
      .insert(checkIns)
      .values({
        resolutionId: resolution.id,
        note: "Worked on this resolution tracker for week 1 and integrated login with GitHub, Apple, and Google OAuth. Started with standard OAuth providers and refined the authentication flow.",
        date: new Date().toISOString().split("T")[0],
      })
      .returning();

    console.log("✅ Created check-in 1");

    const checkIn2 = await db
      .insert(checkIns)
      .values({
        resolutionId: resolution.id,
        note: "Continuing with week 2, I worked on integrating my usage of AI models and am building out an AI model map for analyzing different prompts and things. Added Prompt Playground feature to test prompts across Claude, GPT, and Gemini.",
        date: new Date().toISOString().split("T")[0],
      })
      .returning();

    console.log("✅ Created check-in 2");

    console.log("\n" + "=".repeat(50));
    console.log("✅ Database seeded successfully!");
    console.log("\nCreated:");
    console.log("  - 1 resolution");
    console.log("  - 2 check-ins");
    console.log("\n💡 Note: AI insights will be generated when you view these check-ins in the app");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await pool.end();
    process.exit(1);
  }
}

seedData();
