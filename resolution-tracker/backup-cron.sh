#!/bin/bash
#
# Synology Task Scheduler Script for Database Backups
# 
# Setup Instructions:
# 1. Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script
# 2. General: Name it "Resolution Tracker DB Backup"
# 3. Schedule: Daily at 2:00 AM (or your preferred time)
# 4. Task Settings: Paste this script
# 5. User: root (required for docker access)
#
# The script will:
# - Run daily backups inside the Docker container
# - Keep last 7 days of backups
# - Log backup results
#

# Set paths
PROJECT_DIR="/volume3/docker/projects/resolution-tracker"
LOG_FILE="$PROJECT_DIR/backup-cron.log"
BACKUP_DIR="$PROJECT_DIR/backups"

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting database backup..." >> "$LOG_FILE"

# Run backup inside Docker container
cd "$PROJECT_DIR"
docker-compose exec -T app npm run db:backup >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "[$TIMESTAMP] ✅ Backup completed successfully" >> "$LOG_FILE"
  
  # Clean up old backups (keep last 7 days)
  find "$BACKUP_DIR" -name "backup-*.sql" -mtime +7 -delete
  echo "[$TIMESTAMP] 🗑️  Cleaned up backups older than 7 days" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] ❌ Backup failed" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] Backup process finished" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"
