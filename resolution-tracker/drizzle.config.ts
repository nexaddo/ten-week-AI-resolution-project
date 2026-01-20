import { defineConfig } from "drizzle-kit";

// Support both DATABASE_URL from env and default local development URL
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/resolutions";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. " +
    "Set it as an environment variable or create a .env file with DATABASE_URL=postgresql://..."
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
