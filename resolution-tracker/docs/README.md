# Documentation Index

Welcome to the Resolution Tracker documentation!

## 📖 Quick Navigation

### 🚀 Getting Started

**New to the project?** Start here:
1. **[Local Setup](SETUP_LOCAL.md)** - Set up your development environment
2. **[OAuth Setup](OAUTH_SETUP.md)** - Configure authentication
3. **[Architecture Overview](ARCHITECTURE.md)** - Understand the system

### 🌐 Deployment

**Ready to deploy?** Choose your path:
- **[Quick Start](DEPLOY_QUICK_START.md)** - Deploy in 5 minutes (Synology NAS)
- **[Full Deployment Guide](SYNOLOGY_DEPLOYMENT.md)** - Complete Synology NAS setup
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Don't miss a step

### 🗄️ Database Management

**Working with the database:**
- **[Migrations Guide](MIGRATIONS_GUIDE.md)** - Schema changes & migrations
- **[Database Backup](DATABASE_BACKUP.md)** - Backup & restore procedures

### 🎨 Development

**Building features:**
- **[Design Guidelines](design_guidelines.md)** - UI/UX standards
- **[OAuth Configuration](OAUTH_CONFIG_SUMMARY.md)** - Auth implementation details

### 🔧 Platform Specific

**Other platforms:**
- **[Replit Guide](replit.md)** - Deploy on Replit (legacy)

---

## 📚 Documentation by Topic

### Setup & Installation

| Document | Description | When to Use |
|----------|-------------|-------------|
| [SETUP_LOCAL.md](SETUP_LOCAL.md) | Local development setup | First time setup |
| [OAUTH_SETUP.md](OAUTH_SETUP.md) | OAuth provider configuration | Setting up authentication |
| [OAUTH_CONFIG_SUMMARY.md](OAUTH_CONFIG_SUMMARY.md) | OAuth implementation details | Understanding auth flow |

### Deployment

| Document | Description | When to Use |
|----------|-------------|-------------|
| [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) | 5-minute deployment | Quick deployment |
| [SYNOLOGY_DEPLOYMENT.md](SYNOLOGY_DEPLOYMENT.md) | Complete Synology guide | Full production setup |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Deployment verification | Before/after deployment |

### Database

| Document | Description | When to Use |
|----------|-------------|-------------|
| [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) | Schema management | Making database changes |
| [DATABASE_BACKUP.md](DATABASE_BACKUP.md) | Backup procedures | Protecting your data |

### Architecture

| Document | Description | When to Use |
|----------|-------------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design | Understanding the codebase |
| [design_guidelines.md](design_guidelines.md) | UI/UX standards | Building frontend features |

---

## 🎯 Common Tasks

### "I want to..."

**...set up my local environment**
→ [SETUP_LOCAL.md](SETUP_LOCAL.md)

**...deploy to my Synology NAS**
→ [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) then [SYNOLOGY_DEPLOYMENT.md](SYNOLOGY_DEPLOYMENT.md)

**...add a new database field**
→ [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md)

**...backup my database**
→ [DATABASE_BACKUP.md](DATABASE_BACKUP.md)

**...configure OAuth**
→ [OAUTH_SETUP.md](OAUTH_SETUP.md)

**...understand the codebase**
→ [ARCHITECTURE.md](ARCHITECTURE.md)

**...verify my deployment**
→ [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 📋 Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| SETUP_LOCAL.md | ✅ Complete | Jan 3, 2026 |
| OAUTH_SETUP.md | ✅ Complete | Jan 18, 2026 |
| OAUTH_CONFIG_SUMMARY.md | ✅ Complete | Jan 18, 2026 |
| DEPLOY_QUICK_START.md | ✅ Complete | Jan 18, 2026 |
| SYNOLOGY_DEPLOYMENT.md | ✅ Complete | Jan 18, 2026 |
| DEPLOYMENT_CHECKLIST.md | ✅ Complete | Jan 18, 2026 |
| MIGRATIONS_GUIDE.md | ✅ Complete | Jan 18, 2026 |
| DATABASE_BACKUP.md | ✅ Complete | Jan 18, 2026 |
| ARCHITECTURE.md | ✅ Complete | Jan 3, 2026 |
| design_guidelines.md | ✅ Complete | Jan 3, 2026 |
| replit.md | ⚠️ Legacy | Jan 3, 2026 |

---

## 🔍 Quick Reference

### npm Scripts
```bash
# Development
npm run dev          # Start dev server
npm run check        # Type check

# Database
npm run db:push              # Safe schema push
npm run db:migrate:generate  # Generate migration
npm run db:migrate           # Run migrations
npm run db:backup            # Backup database
npm run db:restore           # Restore database
npm run db:seed              # Seed sample data

# Docker
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs
npm run docker:rebuild  # Rebuild & restart
```

### Important URLs
- Development: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`
- OAuth Callback: `http://localhost:5000/api/auth/callback`

### Environment Variables
See [../.env.example](../.env.example) for all available options.

### File Locations
- Application: `resolution-tracker/`
- Documentation: `resolution-tracker/docs/`
- Backups: `resolution-tracker/backups/`
- Docker Compose: `resolution-tracker/docker-compose.yml`

---

## 🆘 Getting Help

### Troubleshooting

**Application won't start?**
- Check [SETUP_LOCAL.md](SETUP_LOCAL.md) - Common issues section
- Verify environment variables in `.env`
- Check logs in terminal

**Database issues?**
- See [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) - Troubleshooting
- Try `npm run db:restore` if data is corrupted

**OAuth not working?**
- Review [OAUTH_SETUP.md](OAUTH_SETUP.md) - Callback URLs
- Verify credentials in `.env`
- Check redirect URLs match exactly

**Deployment problems?**
- Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- Check [SYNOLOGY_DEPLOYMENT.md](SYNOLOGY_DEPLOYMENT.md) - Troubleshooting section
- Verify Docker logs: `docker compose logs`

### Additional Resources
- Main README: [../README.md](../README.md)
- GitHub Issues: Report bugs and suggestions
- Application logs: Check terminal output

---

## 📝 Contributing to Docs

When adding or updating documentation:

1. **Filename conventions:**
   - Use `UPPERCASE.md` for guides (e.g., `SETUP_LOCAL.md`)
   - Use `lowercase.md` for reference docs (e.g., `design_guidelines.md`)

2. **Structure:**
   - Start with a clear title
   - Include a table of contents for long docs
   - Use headers to organize sections
   - Include code examples where helpful
   - Add troubleshooting sections

3. **Cross-references:**
   - Link to other docs with relative paths
   - Use descriptive link text
   - Keep links up to date

4. **Update this index:**
   - Add new docs to the appropriate section
   - Update the status table
   - Add to "I want to..." section if applicable

---

**Need something not covered here?** Check the main [README](../README.md) or create an issue!
