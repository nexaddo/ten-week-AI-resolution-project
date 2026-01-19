import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";
import { readdir } from "fs/promises";

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = join(process.cwd(), "backups");
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/resolutions";

// Extract database connection details from DATABASE_URL
function parseDatabaseUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

async function listBackups() {
  if (!existsSync(BACKUP_DIR)) {
    console.log("No backups found. Create a backup first with: npm run db:backup");
    return [];
  }

  const files = await readdir(BACKUP_DIR);
  const backups = files
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .reverse();

  return backups;
}

async function restoreDatabase(filename?: string) {
  try {
    const db = parseDatabaseUrl(DATABASE_URL);

    // If no filename provided, list available backups
    if (!filename) {
      const backups = await listBackups();

      if (backups.length === 0) {
        return;
      }

      console.log("\nAvailable backups:");
      backups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${backup}`);
      });
      console.log("\nTo restore a backup, run:");
      console.log("  npm run db:restore <filename>");
      return;
    }

    const filepath = join(BACKUP_DIR, filename);

    if (!existsSync(filepath)) {
      console.error(`❌ Backup file not found: ${filename}`);
      console.log("\nAvailable backups:");
      const backups = await listBackups();
      backups.forEach((backup) => console.log(`  - ${backup}`));
      process.exit(1);
    }

    console.log(`\n⚠️  WARNING: This will overwrite your current database!`);
    console.log(`Database: ${db.database}`);
    console.log(`Backup file: ${filename}\n`);

    // Restore using psql
    const command = `psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -f "${filepath}" --no-password`;

    // Set password via environment variable
    const env = { ...process.env, PGPASSWORD: db.password };

    await execAsync(command, { env });

    console.log(`✅ Database restored successfully from ${filename}`);
  } catch (error) {
    console.error("❌ Restore failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get filename from command line args
const filename = process.argv[2];
restoreDatabase(filename);
