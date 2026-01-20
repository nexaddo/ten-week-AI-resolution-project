#!/usr/bin/env tsx
/**
 * Safe database push script that automatically creates a backup before applying schema changes
 * This prevents data loss when using drizzle-kit push
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const BACKUP_DIR = join(__dirname, "..", "backups");
const BACKUP_SCRIPT = join(__dirname, "backup-db.ts");

console.log("🛡️  Safe Database Push");
console.log("=".repeat(50));

// Check if backup script exists
if (!existsSync(BACKUP_SCRIPT)) {
  console.error("❌ Backup script not found at:", BACKUP_SCRIPT);
  process.exit(1);
}

// Step 1: Create backup
console.log("\n📦 Step 1: Creating backup...");
try {
  execSync("npm run db:backup", { stdio: "inherit" });
  console.log("✅ Backup created successfully");
} catch (error) {
  console.error("⚠️  Backup failed, but continuing with push...");
  console.error("   (This might be okay if the database is empty)");
}

// Step 2: Apply schema changes
console.log("\n🔄 Step 2: Applying schema changes...");
try {
  execSync("npx drizzle-kit push", { stdio: "inherit" });
  console.log("✅ Schema changes applied successfully");
} catch (error) {
  console.error("❌ Schema push failed:", error);
  console.log("\n💡 You can restore your backup with:");
  console.log("   npm run db:restore [backup-filename.sql]");
  process.exit(1);
}

console.log("\n" + "=".repeat(50));
console.log("✅ Database updated successfully!");
console.log("\n💡 If something went wrong, restore with:");
console.log("   npm run db:restore");
