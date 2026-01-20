# Deployment Checklist

Use this checklist when deploying to your Synology NAS or any production environment.

## Pre-Deployment

### Local Environment
- [ ] All features tested locally
- [ ] Database migrations generated (`npm run db:migrate:generate`)
- [ ] Environment variables documented
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript check passes (`npm run check`)
- [ ] Health endpoint tested (`curl http://localhost:5000/api/health`)

### Synology NAS Setup
- [ ] Docker installed on NAS
- [ ] SSH access enabled
- [ ] PostgreSQL container running
- [ ] Database created and configured
- [ ] Network ports configured (5000, 5432)
- [ ] SSL certificate obtained (optional but recommended)

## Deployment Steps

### 1. Prepare Environment File
- [ ] Copy `.env.example` to `.env` on NAS
- [ ] Update `DATABASE_URL` with NAS PostgreSQL credentials
- [ ] Set `NODE_ENV=production`
- [ ] Generate secure `SESSION_SECRET` (min 32 characters)
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Add AI API keys
- [ ] Review all environment variables

### 2. Build and Deploy
Choose one method:

#### Option A: Automated Script
```bash
./script/deploy-to-nas.sh [NAS_IP] [NAS_USER]
```
- [ ] Script completed successfully
- [ ] Health check passed

#### Option B: Manual Deployment
- [ ] Build application: `npm run build`
- [ ] Transfer files to NAS via SCP
- [ ] Build Docker image on NAS
- [ ] Stop old container
- [ ] Start new container
- [ ] Verify health endpoint

### 3. Database Migration
- [ ] SSH into NAS
- [ ] Run migrations: `sudo docker exec -it resolution-tracker npm run db:migrate`
- [ ] Verify migration success
- [ ] Test database connection

### 4. Configure Reverse Proxy
- [ ] Create reverse proxy rule in DSM
- [ ] Configure HTTPS with SSL certificate
- [ ] Test external access
- [ ] Verify OAuth callback URLs work

### 5. Set Up Backups
- [ ] Create backup script on NAS
- [ ] Configure daily backup task in DSM Task Scheduler
- [ ] Test backup manually: `sudo docker exec resolution-tracker npm run db:backup`
- [ ] Verify backups directory is being populated
- [ ] Test restore process

## Post-Deployment Verification

### Application Health
- [ ] Access application via browser
- [ ] Login with OAuth works
- [ ] Create test resolution
- [ ] Add test check-in
- [ ] AI analysis generates insights
- [ ] Prompt Playground accessible
- [ ] AI Analytics dashboard shows data

### Security Checks
- [ ] HTTPS working (if configured)
- [ ] HTTP redirects to HTTPS (if configured)
- [ ] Database port (5432) not exposed to internet
- [ ] Application logs don't show sensitive data
- [ ] Rate limiting active
- [ ] Session management working correctly

### Performance
- [ ] Page load times acceptable
- [ ] API responses < 500ms for most endpoints
- [ ] Database queries optimized
- [ ] Health check responds quickly

### Monitoring
- [ ] Health endpoint accessible: `https://your-domain.com/api/health`
- [ ] Application logs accessible: `sudo docker logs -f resolution-tracker`
- [ ] Database logs accessible: `sudo docker logs -f postgres-resolutions`
- [ ] Disk space monitored for backups directory
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
