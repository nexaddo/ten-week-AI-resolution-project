# Synology NAS Deployment Guide

This guide walks you through deploying the Resolution Tracker application to your Synology NAS with PostgreSQL database using Docker Compose.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
- [Method 2: Manual Docker Commands](#method-2-manual-docker-commands)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

### On Synology NAS
- [ ] Synology DSM 7.0 or later
- [ ] **Container Manager** installed (from Package Center) - includes Docker Compose
- [ ] SSH access enabled
- [ ] Static IP or DDNS configured
- [ ] Ports 80/443 available (or custom ports)

### On Development Machine
- [ ] SSH client (or FileStation access)
- [ ] Git
- [ ] Node.js 18+ (for building)

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Synology NAS                │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │   Docker:    │  │   Docker:   │  │
│  │  PostgreSQL  │  │  App Server │  │
│  │   Port 5432  │  │  Port 5000  │  │
│  └──────────────┘  └─────────────┘  │
│          │              │           │
│          └──────────────┘           │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Reverse Proxy (DSM)         │   │
│  │  Port 80/443                 │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

# Method 1: Docker Compose (Recommended)

This is the easiest and most maintainable way to deploy.

## Step 1: Prepare Your NAS

### 1.1 Install Container Manager

1. Open **Package Center** in DSM
2. Search for **Container Manager**
3. Install (this replaces the old Docker package and includes Docker Compose)

### 1.2 Enable SSH

1. Go to **Control Panel > Terminal & SNMP**
2. Enable **SSH service**
3. Set port (default 22 or custom)
4. Click **Apply**

### 1.3 Create Project Folder

SSH into your NAS:
```bash
ssh admin@your-nas-ip
```

Create project directory:
```bash
sudo mkdir -p /volume1/docker/resolution-tracker
cd /volume1/docker/resolution-tracker
```

## Step 2: Build Application Locally

On your development machine:

```bash
cd resolution-tracker

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 3: Transfer Files to NAS

### Option A: Using SCP (from development machine)

```bash
cd resolution-tracker

# Transfer application files
scp -r dist package.json package-lock.json Dockerfile .dockerignore \
  docker-compose.yml .env.production.example \
  admin@your-nas-ip:/volume1/docker/resolution-tracker/

# Transfer required scripts
scp -r shared drizzle.config.ts admin@your-nas-ip:/volume1/docker/resolution-tracker/

# Create script directory and transfer migration scripts
ssh admin@your-nas-ip "mkdir -p /volume1/docker/resolution-tracker/script"
scp script/backup-db.ts script/restore-db.ts script/migrate.ts \
  admin@your-nas-ip:/volume1/docker/resolution-tracker/script/
```

### Option B: Using File Station (GUI)

1. Open **File Station** in DSM
2. Navigate to `docker/resolution-tracker`
3. Upload files:
   - `dist/` folder
   - `shared/` folder
   - `package.json`
   - `package-lock.json`
   - `Dockerfile`
   - `.dockerignore`
   - `docker-compose.yml`
   - `.env.production.example`
   - `drizzle.config.ts`
4. Create `script/` folder and upload:
   - `backup-db.ts`
   - `restore-db.ts`
   - `migrate.ts`

## Step 4: Configure Environment Variables

SSH into NAS:
```bash
cd /volume1/docker/resolution-tracker
```

Copy and edit environment file:
```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in your actual values:
```env
# Database Password (generate a strong password)
POSTGRES_PASSWORD=your-secure-database-password-here

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-super-secret-session-key-min-32-chars-here

# OAuth Configuration (from your Replit Auth dashboard)
REPLIT_AUTH_DOMAIN=https://auth.replit.com
REPLIT_CLIENT_ID=your-production-client-id
REPLIT_CLIENT_SECRET=your-production-client-secret

# AI Model API Keys
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key

# AI Configuration
AI_STRATEGY=all
AI_ENABLE_ANALYSIS=true
AI_MAX_HISTORICAL_CHECKINS=5
```

**Important:** Update OAuth redirect URLs in your Replit Auth dashboard to point to your production domain!

## Step 5: Deploy with Docker Compose

### 5.1 Start Services

```bash
cd /volume1/docker/resolution-tracker
sudo docker compose --env-file .env.production up -d
```

This will:
- ✅ Pull required Docker images
- ✅ Build the application container
- ✅ Start PostgreSQL database
- ✅ Start application server
- ✅ Create network for inter-container communication
- ✅ Set up health checks

### 5.2 View Logs

```bash
# View all logs
sudo docker compose logs -f

# View only app logs
sudo docker compose logs -f app

# View only database logs
sudo docker compose logs -f postgres
```

### 5.3 Check Container Status

```bash
sudo docker compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
postgres-resolutions    Up (healthy)        0.0.0.0:5432->5432/tcp
resolution-tracker      Up (healthy)        0.0.0.0:5000->5000/tcp
```

## Step 6: Initialize Database

Run migrations:
```bash
sudo docker compose exec app npm run db:migrate
```

Or seed with sample data:
```bash
sudo docker compose exec app npm run db:seed
```

## Step 7: Verify Deployment

Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T...",
  "database": "connected"
}
```

## Step 8: Configure Reverse Proxy

### Using DSM Built-in Reverse Proxy

1. Go to **Control Panel > Login Portal > Advanced**
2. Click **Reverse Proxy**
3. Click **Create**
4. Configure:
   - **Reverse Proxy Name:** Resolution Tracker
   - **Source:**
     - Protocol: HTTPS
     - Hostname: your-domain.com
     - Port: 443
   - **Destination:**
     - Protocol: HTTP
     - Hostname: localhost
     - Port: 5000
5. **Custom Header** tab:
   - Create header: `WebSocket`
   - Click **Save**

### Enable HTTPS

1. Go to **Control Panel > Security > Certificate**
2. Add certificate (Let's Encrypt recommended)
3. Configure for your domain
4. Apply certificate to reverse proxy

## Managing Your Deployment

### Update Application

When you have changes:

```bash
# On development machine - build new version
npm run build

# Transfer updated files
scp -r dist admin@your-nas-ip:/volume1/docker/resolution-tracker/

# On NAS - rebuild and restart
cd /volume1/docker/resolution-tracker
sudo docker compose down
sudo docker compose --env-file .env.production up -d --build
```

### Stop Services

```bash
sudo docker compose down
```

### Start Services

```bash
sudo docker compose --env-file .env.production up -d
```

### Restart Services

```bash
sudo docker compose restart
```

### View Logs

```bash
# All services
sudo docker compose logs -f

# Specific service
sudo docker compose logs -f app
sudo docker compose logs -f postgres
```

### Execute Commands in Container

```bash
# Run backup
sudo docker compose exec app npm run db:backup

# Run migration
sudo docker compose exec app npm run db:migrate

# Access database
sudo docker compose exec postgres psql -U resolutions_user -d resolutions

# Shell access to app container
sudo docker compose exec app sh
```

---

# Method 2: Manual Docker Commands

<details>
<summary>Click to expand manual deployment steps (not recommended)</summary>

This method uses individual docker commands instead of Docker Compose.

## Step 2: Set Up PostgreSQL

### 2.1 Pull PostgreSQL Image

```bash
sudo docker pull postgres:16-alpine
```

### 2.2 Create PostgreSQL Container

Create data directory:
```bash
sudo mkdir -p /volume1/docker/postgresql/data
```

Run PostgreSQL:
```bash
sudo docker run -d \
  --name postgres-resolutions \
  --restart always \
  -e POSTGRES_DB=resolutions \
  -e POSTGRES_USER=resolutions_user \
  -e POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE \
  -v /volume1/docker/postgresql/data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2.3 Build and Run Application

Build image:
```bash
cd /volume1/docker/resolution-tracker
sudo docker build -t resolution-tracker:latest .
```

Run container:
```bash
sudo docker run -d \
  --name resolution-tracker \
  --restart always \
  --link postgres-resolutions:postgres \
  -p 5000:5000 \
  -v /volume1/docker/resolution-tracker/backups:/app/backups \
  --env-file /volume1/docker/resolution-tracker/.env.production \
  resolution-tracker:latest
```

</details>

---

# Post-Deployment Configuration

## Set Up Automated Backups

### Create Backup Script

```bash
sudo nano /volume1/docker/resolution-tracker/backup.sh
```

Add:
```bash
#!/bin/bash

BACKUP_DIR="/volume1/docker/resolution-tracker/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/resolutions-backup-$DATE.sql"

# Run backup
docker compose -f /volume1/docker/resolution-tracker/docker-compose.yml \
  exec -T postgres pg_dump -U resolutions_user resolutions > "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "resolutions-backup-*.sql" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Make executable:
```bash
sudo chmod +x /volume1/docker/resolution-tracker/backup.sh
```

### Schedule with Task Scheduler

1. Go to **Control Panel > Task Scheduler**
2. Create > Scheduled Task > User-defined script
3. **General:**
   - Task: Database Backup
   - User: root
4. **Schedule:**
   - Daily at 2:00 AM
5. **Task Settings:**
   - Run command: `/volume1/docker/resolution-tracker/backup.sh`

## Security Hardening

### Firewall Rules

1. Go to **Control Panel > Security > Firewall**
2. Create rules:
   - Port 5432 (PostgreSQL) - Deny from all except localhost
   - Port 5000 (App) - Deny from all except localhost
   - Port 80/443 - Allow from internet (for reverse proxy)

### Enable 2FA

1. Go to **Control Panel > User**
2. Edit admin account
3. Enable 2-factor authentication

# Monitoring and Maintenance

## Health Checks

Both containers have built-in health checks:

```bash
# Check status
sudo docker compose ps

# View health details
sudo docker inspect resolution-tracker | grep -A 10 Health
sudo docker inspect postgres-resolutions | grep -A 10 Health
```

## View Logs

```bash
# Application logs
sudo docker compose logs -f app

# Database logs
sudo docker compose logs -f postgres

# Last 100 lines
sudo docker compose logs --tail=100 app
```

## Database Maintenance

### Manual Backup

```bash
sudo docker compose exec postgres pg_dump -U resolutions_user resolutions > backup.sql
```

### Restore Backup

```bash
sudo docker compose exec -T postgres psql -U resolutions_user resolutions < backup.sql
```

### Vacuum Database

```bash
sudo docker compose exec postgres psql -U resolutions_user -d resolutions -c "VACUUM ANALYZE;"
```

## Performance Monitoring

### Container Stats

```bash
sudo docker stats postgres-resolutions resolution-tracker
```

### Disk Usage

```bash
# Check volume size
sudo docker volume ls
sudo docker system df -v

# Application disk usage
du -sh /volume1/docker/resolution-tracker/*
```

## Troubleshooting

### Issue: Containers won't start

```bash
# Check logs
sudo docker compose logs

# Check specific service
sudo docker compose logs postgres
sudo docker compose logs app

# Verify environment file
cat .env.production
```

### Issue: Can't connect to database

```bash
# Test database connection
sudo docker compose exec postgres psql -U resolutions_user -d resolutions

# Check network
sudo docker network ls
sudo docker network inspect resolution-tracker_resolution-network
```

### Issue: Health check failing

```bash
# Check health endpoint manually
sudo docker compose exec app curl http://localhost:5000/api/health

# View detailed health check logs
sudo docker inspect resolution-tracker --format='{{json .State.Health}}' | jq
```

### Issue: OAuth not working

1. Verify redirect URLs in Replit Auth dashboard
2. Check `REPLIT_AUTH_DOMAIN` in `.env.production`
3. Ensure reverse proxy is configured correctly
4. Check application logs: `sudo docker compose logs app | grep -i oauth`

## Accessing Your Application

- **Internal:** `http://your-nas-ip:5000`
- **External:** `https://your-domain.com` (via reverse proxy)
- **Health Check:** `http://your-nas-ip:5000/api/health`

## Quick Reference Commands

```bash
# Navigate to project
cd /volume1/docker/resolution-tracker

# Start services
sudo docker compose --env-file .env.production up -d

# Stop services
sudo docker compose down

# Restart services
sudo docker compose restart

# View logs
sudo docker compose logs -f

# Check status
sudo docker compose ps

# Update application
sudo docker compose down
sudo docker compose --env-file .env.production up -d --build

# Run backup
sudo docker compose exec app npm run db:backup

# Run migrations
sudo docker compose exec app npm run db:migrate

# Access database
sudo docker compose exec postgres psql -U resolutions_user -d resolutions

# Remove everything (including volumes)
sudo docker compose down -v
```

## Container Manager GUI (Alternative)

You can also manage containers via DSM's Container Manager:

1. Open **Container Manager**
2. Go to **Project** tab
3. Click **Create**
4. Set:
   - Project Name: `resolution-tracker`
   - Path: `/docker/resolution-tracker`
   - Source: `Upload docker-compose.yml`
5. Upload `docker-compose.yml`
6. Configure environment variables in GUI
7. Click **Deploy**

This provides a visual interface for managing your deployment!

## Next Steps

1. ✅ Configure SSL certificate
2. ✅ Set up automated backups
3. ✅ Test disaster recovery
4. ✅ Monitor resource usage
5. ✅ Set up alerts (optional)
6. ✅ Document your OAuth URLs

## Support Resources

- Synology Docker: https://kb.synology.com/en-global/DSM/help/Docker/
- Docker Compose: https://docs.docker.com/compose/
- Application Issues: Check logs with `docker compose logs`
