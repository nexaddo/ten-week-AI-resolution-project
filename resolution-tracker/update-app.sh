#!/bin/bash
#
# Resolution Tracker Auto-Update Script
# 
# Synology Task Scheduler Setup:
# 1. Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script
# 2. General: Name "Resolution Tracker Update", User: root
# 3. Schedule: Weekly or on-demand
# 4. Task Settings: Paste this script path or contents
#
# This script will:
# - Pull the latest Docker image from GHCR
# - Restart containers if a new image was downloaded
# - Log the results
#

# Configuration
PROJECT_DIR="/volume3/docker/projects/resolution-tracker"
LOG_FILE="$PROJECT_DIR/update.log"
IMAGE="ghcr.io/nexaddo/ten-week-ai-resolution-project:latest"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting update check..." >> "$LOG_FILE"

cd "$PROJECT_DIR" || {
    echo "[$TIMESTAMP] ❌ Failed to cd to $PROJECT_DIR" >> "$LOG_FILE"
    exit 1
}

# Get current image ID before pull
OLD_IMAGE_ID=$(docker images -q "$IMAGE" 2>/dev/null)

# Pull latest image (public - no auth needed)
echo "[$TIMESTAMP] Pulling latest image..." >> "$LOG_FILE"
docker-compose pull >> "$LOG_FILE" 2>&1

# Get new image ID after pull
NEW_IMAGE_ID=$(docker images -q "$IMAGE" 2>/dev/null)

# Check if image changed
if [ "$OLD_IMAGE_ID" != "$NEW_IMAGE_ID" ]; then
    echo "[$TIMESTAMP] 🔄 New image detected! Restarting containers..." >> "$LOG_FILE"
    docker-compose up -d >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[$TIMESTAMP] ✅ Update completed successfully" >> "$LOG_FILE"
        
        # Clean up old images
        docker image prune -f >> "$LOG_FILE" 2>&1
        echo "[$TIMESTAMP] 🗑️ Cleaned up old images" >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] ❌ Failed to restart containers" >> "$LOG_FILE"
    fi
else
    echo "[$TIMESTAMP] ℹ️ Already running latest version" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] Update check finished" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"
