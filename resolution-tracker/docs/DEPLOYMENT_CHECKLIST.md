# Deployment Checklist

Use this checklist when deploying to your Synology NAS or any production environment.

## Pre-Deployment

### Local Environment
- [ ] All features tested locally
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript check passes (`npm run check`)
- [ ] Health endpoint tested (`curl http://localhost:5000/api/health`)

### Synology NAS Setup
- [ ] Container Manager installed on NAS
- [ ] SSH access enabled
- [ ] Project directory created (`/volume1/docker/resolution-tracker`)
- [ ] Network ports available (5002 for app)

## Deployment Steps

### 1. Prepare Configuration
- [ ] Copy `docker-compose.yml` to NAS
- [ ] Copy `.env.nas.example` to NAS as `.env`
- [ ] Fill in required environment variables:
  - [ ] `POSTGRES_PASSWORD` - secure database password
  - [ ] `SESSION_SECRET` - min 32 character secret
  - [ ] `HOST` - your production domain
  - [ ] GitHub OAuth credentials (SEPARATE production app!)
  - [ ] Google OAuth credentials (can reuse dev)
  - [ ] AI API keys (optional)

### 2. OAuth Setup
**Critical: GitHub requires separate OAuth apps for dev/prod!**
- [ ] Create production GitHub OAuth app
  - Callback: `https://yourdomain.com/api/auth/github/callback`
- [ ] Add production redirect URIs to Google (if using)
  - Callback: `https://yourdomain.com/api/auth/google/callback`

### 3. Deploy
```bash
cd /volume1/docker/resolution-tracker
sudo docker-compose pull
sudo docker-compose up -d
```
- [ ] Images pulled successfully
- [ ] Containers started
- [ ] Health check passed

### 4. Configure Reverse Proxy
- [ ] Create reverse proxy rule in DSM
- [ ] Source: HTTPS, your-domain.com, port 443
- [ ] Destination: HTTP, localhost, port 5002
- [ ] Custom headers added:
  - [ ] `X-Forwarded-Proto: https`
  - [ ] `X-Forwarded-Host: yourdomain.com`
- [ ] WebSocket support enabled
- [ ] SSL certificate configured (Let's Encrypt)

### 5. Set Up Backups
- [ ] Test manual backup: `sudo docker-compose exec app npm run db:backup`
- [ ] Configure Task Scheduler for daily backups (see MIGRATIONS_AND_BACKUPS.md)
- [ ] Verify backups directory is being populated

## Post-Deployment Verification

### Application Health
- [ ] Access app via browser (internal IP)
- [ ] Access app via domain (after reverse proxy)
- [ ] OAuth login works (test each provider)
- [ ] Create test resolution
- [ ] Add test check-in
- [ ] AI analysis generates insights (if API keys set)

### Security Checks
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] OAuth callbacks working
- [ ] Rate limiting active
- [ ] Session management working

### Performance
- [ ] Page load times acceptable
- [ ] API responses < 500ms
- [ ] Health check responds quickly

## Maintenance Commands

```bash
# View logs
sudo docker-compose logs -f

# Restart
sudo docker-compose restart

# Update to new version
sudo docker-compose pull && sudo docker-compose up -d

# Backup database
sudo docker-compose exec app npm run db:backup

# Check container status
sudo docker-compose ps
```

## Rollback Plan

If deployment fails:
```bash
# Stop containers
sudo docker-compose down

# Check logs for issues
sudo docker-compose logs --tail=100

# If database issues, restore from backup
sudo docker-compose exec app npm run db:restore
```

## Updates (Future Releases)

When new releases are published:
1. Check release notes for breaking changes
2. Pull new image: `sudo docker-compose pull`
3. Restart: `sudo docker-compose up -d`
4. Migrations run automatically
5. Verify health endpoint
- [ ] Set up alerts for container failures (optional)

## Rollback Plan

If deployment fails:

1. **Restore Previous Container**
   ```bash
   sudo docker stop resolution-tracker
   sudo docker rm resolution-tracker
   sudo docker run -d [previous container settings]
   ```

2. **Restore Database Backup**
   ```bash
   npm run db:restore [backup-filename.sql]
   ```

3. **Check Logs**
   ```bash
   sudo docker logs resolution-tracker
   ```

## Regular Maintenance Tasks

### Daily
- [ ] Check backup task ran successfully
- [ ] Review application logs for errors

### Weekly
- [ ] Check disk space
- [ ] Review backup retention
- [ ] Test backup restore process

### Monthly
- [ ] Update Docker images
- [ ] Review and apply security patches
- [ ] Check SSL certificate expiration
- [ ] Review and optimize database performance
- [ ] Clean up old Docker images: `sudo docker image prune -a`

## Troubleshooting

### Common Issues

**Application won't start**
- Check environment variables
- Verify database connection
- Review Docker logs
- Ensure ports aren't already in use

**Database connection failed**
- Verify PostgreSQL container running
- Check DATABASE_URL format
- Verify network link between containers
- Test connection manually

**OAuth login fails**
- Verify redirect URLs configured correctly
- Check OAuth credentials in .env
- Review application logs for specific error
- Ensure REPLIT_AUTH_DOMAIN is correct

**AI features not working**
- Verify API keys in .env
- Check AI provider status pages
- Review usage limits/quotas
- Check application logs for API errors

## Emergency Contacts

- Synology Support: [Link to support]
- Database Admin: [Contact]
- OAuth Provider Support: [Links]
- AI Provider Status Pages:
  - Anthropic: https://status.anthropic.com
  - OpenAI: https://status.openai.com
  - Google AI: https://status.cloud.google.com

## Documentation References

- Full Deployment Guide: [SYNOLOGY_DEPLOYMENT.md](SYNOLOGY_DEPLOYMENT.md)
- Migrations Guide: [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md)
- Database Backup Guide: [DATABASE_BACKUP.md](DATABASE_BACKUP.md)
- OAuth Setup: [OAUTH_SETUP.md](OAUTH_SETUP.md)
