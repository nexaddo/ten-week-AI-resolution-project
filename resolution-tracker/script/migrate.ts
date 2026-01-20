#!/usr/bin/env tsx
/**
 * Migration script to apply database migrations safely
 * Use this instead of db:push for production to preserve data
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    // Check if migrations folder exists, if not skip (no migrations yet)
    const migrationsFolder = join(__dirname, "..", "drizzle");
    
    await migrate(db, {
      migrationsFolder,
    });

    console.log("✅ Migrations completed successfully");
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    // If no migrations folder exists, that's okay (using db:push instead)
    if (error?.message?.includes("ENOENT") || error?.code === "ENOENT") {
      console.log("ℹ️  No migrations folder found - skipping migrations");
      await pool.end();
      process.exit(0);
    }
    
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
