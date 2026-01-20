# Database Backup & Restore Guide

This guide explains how to backup and restore your PostgreSQL database for the Resolution Tracker application.

## Prerequisites

- PostgreSQL must be installed and `pg_dump` / `psql` must be in your PATH
- Database must be running
- `DATABASE_URL` environment variable must be set in `.env`

## Creating a Backup

To create a backup of your database:

```bash
npm run db:backup
```

This will:
- Create a `backups/` directory if it doesn't exist
- Generate a timestamped SQL backup file
- Save it as `backups/resolutions-backup-YYYY-MM-DDTHH-MM-SS.sql`

Example output:
```
✓ Created backup directory: C:\_git\...\backups

Backing up database: resolutions
Backup file: resolutions-backup-2026-01-18T19-35-22.sql

✅ Database backup completed successfully!
📁 Backup saved to: C:\_git\...\backups\resolutions-backup-2026-01-18T19-35-22.sql

To restore this backup, run:
  npm run db:restore resolutions-backup-2026-01-18T19-35-22.sql
```

## Listing Available Backups

To see all available backups:

```bash
npm run db:restore
```

This will display a list of all backup files in the `backups/` directory.

## Restoring a Backup

To restore a specific backup:

```bash
npm run db:restore resolutions-backup-2026-01-18T19-35-22.sql
```

⚠️ **WARNING**: This will overwrite your current database!

## Backup Schedule Recommendations

### For Development
- Backup before major changes or experiments
- Manual backups are usually sufficient

### For Production
- Set up automated daily backups
- Keep backups for at least 7-30 days
- Store backups in a separate location (cloud storage, external drive)

### When Testing AI Features
- **Backup before testing** - AI analysis will create many records
- Recommended: Create a backup before your first test run
- This allows you to reset and compare different AI strategies

## Automated Backups (Optional)

### Windows Task Scheduler
Create a scheduled task to run:
```bash
cd C:\_git\ten-week-AI-resolution-project\resolution-tracker && npm run db:backup
```

### Cron (Linux/Mac)
Add to your crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/resolution-tracker && npm run db:backup
```

## Backup Files

Backup files are stored in:
```
resolution-tracker/backups/
```

File format:
```
resolutions-backup-YYYY-MM-DDTHH-MM-SS.sql
```

Example:
```
backups/
├── resolutions-backup-2026-01-18T09-00-00.sql
├── resolutions-backup-2026-01-18T15-30-00.sql
└── resolutions-backup-2026-01-19T10-00-00.sql
```

## What's Included in Backups

Backups include:
- ✅ All resolutions and milestones
- ✅ Check-ins and progress tracking
- ✅ AI insights and model usage data
- ✅ User accounts and sessions
- ✅ Database schema and constraints

## Troubleshooting

### "pg_dump: command not found"
**Solution**: Add PostgreSQL bin directory to your PATH
- Windows: `C:\Program Files\PostgreSQL\16\bin`
- Mac (Homebrew): `/usr/local/opt/postgresql@16/bin`
- Linux: Usually already in PATH

### "Connection refused"
**Solution**: Make sure PostgreSQL is running
```bash
# Windows
net start postgresql-x64-16

# Mac (Homebrew)
brew services start postgresql@16

# Linux
sudo systemctl start postgresql
```

### "Permission denied"
**Solution**: Check your DATABASE_URL credentials in `.env`

## Best Practices

1. **Backup Before Updates**
   - Before updating dependencies
   - Before schema migrations
   - Before major feature changes

2. **Test Restore Process**
   - Periodically test that restores work
   - Verify data integrity after restore

3. **Keep Multiple Backups**
   - Don't delete old backups immediately
   - Keep at least 3-5 recent backups

4. **Secure Your Backups**
   - Backups may contain sensitive user data
   - Don't commit backups to git (already in .gitignore)
   - Store securely if sharing or archiving

## Quick Reference

```bash
# Create backup
npm run db:backup

# List backups
npm run db:restore

# Restore specific backup
npm run db:restore filename.sql

# Before testing AI features
npm run db:backup  # Save your current state

# After testing, to start fresh
npm run db:restore your-backup-file.sql
```
