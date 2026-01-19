#!/usr/bin/env tsx
/**
 * Migration script to apply database migrations safely
 * Use this instead of db:push for production to preserve data
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { join } from "path";

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

async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    await migrate(db, {
      migrationsFolder: join(__dirname, "..", "drizzle"),
    });

    console.log("✅ Migrations completed successfully");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
