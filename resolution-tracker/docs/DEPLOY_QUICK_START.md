# Quick Start: Deploy to Synology NAS

The fastest way to deploy Resolution Tracker to Synology NAS using Docker images from GitHub Container Registry (GHCR).

## TL;DR

```bash
# 1. Transfer config files to NAS
scp docker-compose.yml .env.nas.example admin@your-nas-ip:/volume1/docker/resolution-tracker/

# 2. Configure on NAS
ssh admin@your-nas-ip
cd /volume1/docker/resolution-tracker
cp .env.nas.example .env
nano .env  # Fill in your values

# 3. Pull and deploy!
sudo docker-compose pull
sudo docker-compose up -d
```

Done! Access at `http://your-nas-ip:5002`

**Note:** Database migrations run automatically on container startup.

## Detailed Steps

### 1. Prerequisites (One-Time Setup)

On your Synology NAS:
1. Install **Container Manager** from Package Center
2. Enable SSH in Control Panel > Terminal & SNMP
3. Create folder: `/volume1/docker/resolution-tracker`

### 2. Transfer Configuration Files

From your local machine:
```bash
cd resolution-tracker
scp docker-compose.yml .env.nas.example admin@your-nas-ip:/volume1/docker/resolution-tracker/
```

**Note:** No need to build locally - Docker images are pulled from GHCR!

### 3. Configure Environment

SSH to NAS:
```bash
ssh admin@your-nas-ip
cd /volume1/docker/resolution-tracker
cp .env.nas.example .env
nano .env
```

Minimum required values:
```env
# Required
POSTGRES_PASSWORD=your-secure-password
SESSION_SECRET=your-long-random-secret-32-chars-min
HOST=resolutions.yourdomain.com

# OAuth (create SEPARATE GitHub app for production!)
GITHUB_CLIENT_ID=your-production-github-id
GITHUB_CLIENT_SECRET=your-production-github-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# AI (optional)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
```

### 4. Deploy

```bash
sudo docker-compose pull
sudo docker-compose up -d
```

Watch it start:
```bash
sudo docker-compose logs -f
```

**Note:** Migrations run automatically on container startup!

### 5. Configure Reverse Proxy (for HTTPS)

For OAuth to work with external domain:

1. **Control Panel → Login Portal → Advanced → Reverse Proxy**
2. Click **Create**:
   - Source: `HTTPS`, `resolutions.yourdomain.com`, port `443`
   - Destination: `HTTP`, `localhost`, port `5002`
3. **Custom Header** tab → Add `X-Forwarded-Proto: https`
4. Enable WebSocket support

### 6. Verify

```bash
# Check health
curl http://localhost:5002/api/health

# Should see:
# {"status":"healthy","timestamp":"...","database":"connected"}
```

### 7. Access Application

- Internal: `http://your-nas-ip:5002`
- External: `https://resolutions.yourdomain.com` (after reverse proxy setup)

## Updating to New Versions

When a new release is published:
```bash
cd /volume1/docker/resolution-tracker
sudo docker-compose pull
sudo docker-compose up -d
```

Migrations run automatically on restart!

## Common Commands

```bash
# View logs
sudo docker-compose logs -f

# Restart
sudo docker-compose restart

# Stop
sudo docker-compose down

# Backup database
sudo docker-compose exec app npm run db:backup

# Access database
sudo docker-compose exec postgres psql -U resolutions_user -d resolutions
```

## Troubleshooting

**Containers won't start?**
```bash
sudo docker-compose logs
```

**Port conflicts?**
```bash
# Check what's using the port
sudo netstat -tlnp | grep 5002
```

**OAuth not working?**
- Ensure `HOST` is set correctly in `.env`
- Check reverse proxy custom headers include `X-Forwarded-Proto: https`
- Verify OAuth callback URLs match your domain
- Remember: GitHub requires separate OAuth apps for dev/prod!

**Can't pull from GHCR?**
```bash
# Login to GitHub Container Registry
echo "YOUR_GITHUB_PAT" | sudo docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## What's Deployed

Docker images are pulled from GitHub Container Registry:
- `ghcr.io/nexaddo/ten-week-ai-resolution-project:latest`
- PostgreSQL 16 database (persistent data)
- Automatic migrations on startup
- Health checks
- Backup scripts

## Next Steps

After basic deployment:
1. [Set up HTTPS with reverse proxy](SYNOLOGY_DEPLOYMENT.md#step-8-configure-reverse-proxy)
2. [Configure automated backups](MIGRATIONS_AND_BACKUPS.md)
3. [Security hardening](SYNOLOGY_DEPLOYMENT.md#security-hardening)

## Full Documentation

For complete details, see:
- [Full Synology Deployment Guide](SYNOLOGY_DEPLOYMENT.md)
- [Migrations & Backups](MIGRATIONS_AND_BACKUPS.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
