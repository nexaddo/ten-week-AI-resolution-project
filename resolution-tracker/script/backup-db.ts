import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

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

async function backupDatabase() {
  try {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`✓ Created backup directory: ${BACKUP_DIR}`);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `resolutions-backup-${timestamp}.sql`;
    const filepath = join(BACKUP_DIR, filename);

    const db = parseDatabaseUrl(DATABASE_URL);

    console.log(`\nBacking up database: ${db.database}`);
    console.log(`Backup file: ${filename}\n`);

    // Use pg_dump to create backup
    const command = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -f "${filepath}" --no-password`;

    // Set password via environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: db.password };

    await execAsync(command, { env });

    console.log(`✅ Database backup completed successfully!`);
    console.log(`📁 Backup saved to: ${filepath}`);
    console.log(`\nTo restore this backup, run:`);
    console.log(`  npm run db:restore ${filename}`);

    return filepath;
  } catch (error) {
    console.error("❌ Backup failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run backup
backupDatabase();
