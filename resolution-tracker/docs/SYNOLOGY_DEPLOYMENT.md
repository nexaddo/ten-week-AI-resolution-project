# Synology NAS Deployment Guide

Deploy Resolution Tracker to your Synology NAS using pre-built Docker images from GitHub Container Registry (GHCR).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Reverse Proxy Configuration](#reverse-proxy-configuration)
- [Updating the Application](#updating-the-application)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### On Synology NAS
- Synology DSM 7.0 or later
- **Container Manager** installed (from Package Center)
- SSH access enabled
- Static IP or DDNS configured

### Files Needed (from repo)
- `docker-compose.yml`
- `.env.nas.example`

## Architecture

```
┌─────────────────────────────────────┐
│         Synology NAS                │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │   Docker:    │  │   Docker:   │  │
│  │  PostgreSQL  │◄─┤  App Server │  │
│  │  (internal)  │  │  Port 5002  │  │
│  └──────────────┘  └─────────────┘  │
│                          │          │
│  ┌──────────────────────────────┐   │
│  │  Reverse Proxy (DSM)         │   │
│  │  HTTPS 443 → localhost:5002  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘

Docker Image: ghcr.io/nexaddo/ten-week-ai-resolution-project:latest
```

---

## Quick Start

```bash
# 1. Create directory on NAS
ssh admin@your-nas-ip
sudo mkdir -p /volume1/docker/resolution-tracker
cd /volume1/docker/resolution-tracker

# 2. Transfer config files (from local machine)
scp docker-compose.yml .env.nas.example admin@your-nas-ip:/volume1/docker/resolution-tracker/

# 3. Configure
ssh admin@your-nas-ip
cd /volume1/docker/resolution-tracker
cp .env.nas.example .env
nano .env  # Fill in your secrets

# 4. Deploy
sudo docker-compose pull
sudo docker-compose up -d
```

Access at `http://your-nas-ip:5002`

**Note:** Migrations run automatically on startup!

---

## Detailed Setup

### Step 1: Enable SSH

1. **Control Panel → Terminal & SNMP**
2. Enable **SSH service**
3. Click **Apply**

### Step 2: Create Project Directory

```bash
ssh admin@your-nas-ip
sudo mkdir -p /volume1/docker/resolution-tracker
cd /volume1/docker/resolution-tracker
```

### Step 3: Transfer Configuration

From your local machine:
```bash
cd resolution-tracker
scp docker-compose.yml .env.nas.example admin@your-nas-ip:/volume1/docker/resolution-tracker/
```

### Step 4: Configure Environment

```bash
cd /volume1/docker/resolution-tracker
cp .env.nas.example .env
nano .env
```

**Required values:**
```env
# Database
POSTGRES_PASSWORD=your-secure-password

# Session
SESSION_SECRET=your-long-secret-min-32-chars

# Server (for OAuth callbacks)
HOST=resolutions.yourdomain.com

# OAuth - GitHub (MUST create separate production OAuth app!)
GITHUB_CLIENT_ID=your-prod-github-id
GITHUB_CLIENT_SECRET=your-prod-github-secret

# OAuth - Google (can reuse dev credentials)
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# AI Keys (optional)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
```

**Important:** GitHub only allows ONE callback URL per OAuth app. Create separate apps for:
- Development: `http://localhost:5000/api/auth/github/callback`
- Production: `https://yourdomain.com/api/auth/github/callback`

### Step 5: Deploy

```bash
sudo docker-compose pull
sudo docker-compose up -d
```

### Step 6: Verify

```bash
# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f

# Test health
curl http://localhost:5002/api/health
```

---

## Reverse Proxy Configuration

Required for HTTPS and OAuth to work correctly.

### Step 1: Create Reverse Proxy Rule

1. **Control Panel → Login Portal → Advanced → Reverse Proxy**
2. Click **Create**
3. Configure:
   - **Description:** Resolution Tracker
   - **Source:**
     - Protocol: `HTTPS`
     - Hostname: `resolutions.yourdomain.com`
     - Port: `443`
   - **Destination:**
     - Protocol: `HTTP`
     - Hostname: `localhost`
     - Port: `5002`

### Step 2: Add Custom Headers (Critical for OAuth!)

In the **Custom Header** tab:
1. Click **Create → WebSocket**
2. Add header: `X-Forwarded-Proto` = `https`
3. Add header: `X-Forwarded-Host` = `resolutions.yourdomain.com`

Without these headers, OAuth callbacks will fail!

### Step 3: SSL Certificate

1. **Control Panel → Security → Certificate**
2. Click **Add → Get a certificate from Let's Encrypt**
3. Enter your domain and email
4. Apply certificate to the reverse proxy service

### Step 4: Synology DDNS (Optional)

If you don't have a custom domain:
1. **Control Panel → External Access → DDNS**
2. Create a Synology DDNS hostname
3. Use a subdomain like `resolutions.yourname.synology.me`

---

## Updating the Application

New releases are published automatically via GitHub Actions.

```bash
cd /volume1/docker/resolution-tracker

# Pull latest image
sudo docker-compose pull

# Restart with new version
sudo docker-compose up -d
```

Migrations run automatically on startup!

### Check Releases

Visit [GitHub Releases](https://github.com/nexaddo/ten-week-AI-resolution-project/releases) for:
- Changelog
- Version info
- Breaking changes

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
sudo docker-compose logs -f

# App only
sudo docker-compose logs -f app

# Last 100 lines
sudo docker-compose logs --tail=100 app
```

### Database Backup

```bash
# Manual backup
sudo docker-compose exec app npm run db:backup

# List backups
ls -lh backups/
```

### Automated Daily Backups

See [MIGRATIONS_AND_BACKUPS.md](MIGRATIONS_AND_BACKUPS.md) for Synology Task Scheduler setup.

### Container Management

```bash
# Restart
sudo docker-compose restart

# Stop
sudo docker-compose down

# Stop and delete data (careful!)
sudo docker-compose down -v

# Check stats
sudo docker stats
```

### Database Access

```bash
sudo docker-compose exec postgres psql -U resolutions_user -d resolutions
```

---

## Troubleshooting

### Port Conflicts

```bash
sudo netstat -tlnp | grep 5002
```

Edit port in `docker-compose.yml` if 5002 is in use.

### OAuth Not Working

1. ✅ Check `HOST` is set correctly in `.env`
2. ✅ Verify reverse proxy custom headers are set
3. ✅ Confirm OAuth callback URLs match your domain
4. ✅ Remember: GitHub needs SEPARATE dev/prod OAuth apps!

### Can't Pull from GHCR

```bash
echo "YOUR_GITHUB_PAT" | sudo docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

The image is public, so authentication usually isn't needed.

### Container Won't Start

```bash
# Check logs
sudo docker-compose logs app

# Verify .env file
cat .env | grep -v PASSWORD

# Recreate containers
sudo docker-compose down
sudo docker-compose up -d
```

### Database Issues

```bash
# Check postgres status
sudo docker-compose logs postgres

# Test connection
sudo docker-compose exec postgres psql -U resolutions_user -d resolutions -c "SELECT 1"
```

---

## Quick Reference

```bash
# Navigate to project
cd /volume1/docker/resolution-tracker

# Pull and deploy
sudo docker-compose pull && sudo docker-compose up -d

# View logs
sudo docker-compose logs -f

# Restart
sudo docker-compose restart

# Backup database
sudo docker-compose exec app npm run db:backup

# Access database
sudo docker-compose exec postgres psql -U resolutions_user -d resolutions

# Check health
curl http://localhost:5002/api/health
```

---

## Related Documentation

- [Quick Start Guide](DEPLOY_QUICK_START.md)
- [Migrations & Backups](MIGRATIONS_AND_BACKUPS.md)
- [OAuth Setup](OAUTH_SETUP.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
