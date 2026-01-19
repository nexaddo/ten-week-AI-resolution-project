# Quick Start: Deploy to Synology NAS

The fastest way to deploy your Resolution Tracker to Synology NAS using Docker Compose.

## TL;DR

```bash
# 1. Build locally
npm run build

# 2. Transfer to NAS (one command)
scp -r dist shared package*.json Dockerfile .dockerignore docker-compose.yml .env.production.example drizzle.config.ts admin@your-nas-ip:/volume1/docker/resolution-tracker/ && \
ssh admin@your-nas-ip "mkdir -p /volume1/docker/resolution-tracker/script" && \
scp script/{backup-db,restore-db,migrate}.ts admin@your-nas-ip:/volume1/docker/resolution-tracker/script/

# 3. Configure on NAS
ssh admin@your-nas-ip
cd /volume1/docker/resolution-tracker
cp .env.production.example .env.production
nano .env.production  # Fill in your values

# 4. Deploy!
sudo docker compose --env-file .env.production up -d

# 5. Initialize database
sudo docker compose exec app npm run db:migrate
```

Done! Access at `http://your-nas-ip:5000`

## Detailed Steps

### 1. Prerequisites (One-Time Setup)

On your Synology NAS:
1. Install **Container Manager** from Package Center
2. Enable SSH in Control Panel > Terminal & SNMP
3. Create folder: `/volume1/docker/resolution-tracker`

### 2. Build Application

On your local machine:
```bash
cd resolution-tracker
npm install
npm run build
```

### 3. Transfer Files

**Quick transfer (recommended):**
```bash
# Single command to transfer everything
scp -r dist shared package.json package-lock.json Dockerfile .dockerignore \
  docker-compose.yml .env.production.example drizzle.config.ts \
  admin@your-nas-ip:/volume1/docker/resolution-tracker/

# Transfer scripts
ssh admin@your-nas-ip "mkdir -p /volume1/docker/resolution-tracker/script"
scp script/backup-db.ts script/restore-db.ts script/migrate.ts \
  admin@your-nas-ip:/volume1/docker/resolution-tracker/script/
```

**Or use File Station GUI** - Upload files to `docker/resolution-tracker`

### 4. Configure Environment

SSH to NAS:
```bash
ssh admin@your-nas-ip
cd /volume1/docker/resolution-tracker
cp .env.production.example .env.production
nano .env.production
```

Minimum required values:
```env
POSTGRES_PASSWORD=your-secure-password
SESSION_SECRET=your-long-random-secret-32-chars-min
REPLIT_CLIENT_ID=your-oauth-id
REPLIT_CLIENT_SECRET=your-oauth-secret
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
```

### 5. Deploy

```bash
sudo docker compose --env-file .env.production up -d
```

Watch it start:
```bash
sudo docker compose logs -f
```

### 6. Initialize Database

```bash
# Run migrations
sudo docker compose exec app npm run db:migrate

# Or seed with sample data
sudo docker compose exec app npm run db:seed
```

### 7. Verify

```bash
# Check health
curl http://localhost:5000/api/health

# Should see:
# {"status":"healthy","timestamp":"...","database":"connected"}
```

### 8. Access Application

- Internal: `http://your-nas-ip:5000`
- Set up reverse proxy for HTTPS (see full guide)

## Common Commands

```bash
# View logs
sudo docker compose logs -f

# Restart
sudo docker compose restart

# Stop
sudo docker compose down

# Update (after rebuilding locally)
sudo docker compose down
sudo docker compose --env-file .env.production up -d --build

# Backup database
sudo docker compose exec app npm run db:backup

# Access database
sudo docker compose exec postgres psql -U resolutions_user -d resolutions
```

## Using npm Scripts (Optional)

If you prefer npm commands:
```bash
npm run docker:up       # Start services
npm run docker:down     # Stop services
npm run docker:logs     # View logs
npm run docker:rebuild  # Rebuild and restart
```

## Troubleshooting

**Containers won't start?**
```bash
sudo docker compose logs
```

**Can't connect to database?**
```bash
# Check environment
cat .env.production | grep POSTGRES_PASSWORD

# Test connection
sudo docker compose exec postgres psql -U resolutions_user -d resolutions
```

**OAuth not working?**
- Update redirect URLs in Replit Auth dashboard
- Use your production domain, not `localhost`

## What Gets Installed

When you run `docker compose up`:
1. PostgreSQL 16 database (persistent data)
2. Your Resolution Tracker app
3. Automatic health checks
4. Network for container communication
5. Volume for database persistence

All managed with one command!

## Next Steps

After basic deployment:
1. [Set up HTTPS with reverse proxy](SYNOLOGY_DEPLOYMENT.md#step-8-configure-reverse-proxy)
2. [Configure automated backups](SYNOLOGY_DEPLOYMENT.md#set-up-automated-backups)
3. [Security hardening](SYNOLOGY_DEPLOYMENT.md#security-hardening)

## Full Documentation

For complete details, see:
- [Full Synology Deployment Guide](SYNOLOGY_DEPLOYMENT.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Migrations Guide](MIGRATIONS_GUIDE.md)
