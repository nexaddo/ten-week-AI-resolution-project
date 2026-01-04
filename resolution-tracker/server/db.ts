import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Support both DATABASE_URL from env and default local development URL
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/resolutions";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
    "For local development, create a .env file based on .env.example or set DATABASE_URL manually."
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });
