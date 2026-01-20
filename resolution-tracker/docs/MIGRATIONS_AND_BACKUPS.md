# Database Migrations & Backups

## Automatic Migrations on Startup

The Docker container now automatically runs database migrations when it starts. This is handled by the `docker-entrypoint.sh` script.

**How it works:**
1. Container starts
2. Entrypoint script runs `npm run db:migrate`
3. If migrations exist in `drizzle/` folder, they are applied
4. If no migrations exist (using `db:push` workflow), startup continues normally
5. Application starts

**Note:** Currently this project uses `db:push` for schema changes (no migrations folder). The migration step will be skipped gracefully but is ready for when you generate migrations.

## Automated Backups (Synology NAS)

### Setup Daily Backups

1. **SSH into your NAS** and copy the backup script:
   ```bash
   cd /volume3/docker/projects/resolution-tracker
   # The backup-cron.sh script should already be deployed
   chmod +x backup-cron.sh
   ```

2. **Configure Synology Task Scheduler:**
   - Open **Control Panel** → **Task Scheduler**
   - Click **Create** → **Scheduled Task** → **User-defined script**
   - **General tab:**
     - Task name: `Resolution Tracker DB Backup`
     - User: `root` (required for Docker access)
   - **Schedule tab:**
     - Run daily at `2:00 AM` (or your preferred time)
   - **Task Settings tab:**
     - Paste the contents of `backup-cron.sh`
     - Or reference the script: `/volume3/docker/projects/resolution-tracker/backup-cron.sh`

3. **Test the backup:**
   ```bash
   sudo /volume3/docker/projects/resolution-tracker/backup-cron.sh
   ```

### Backup Details

- **Frequency:** Daily at scheduled time
- **Retention:** Keeps last 7 days of backups
- **Location:** `/volume3/docker/projects/resolution-tracker/backups/`
- **Format:** SQL dumps named `backup-YYYY-MM-DD_HH-MM-SS.sql`
- **Logs:** Written to `backup-cron.log` in project directory

### Manual Backup/Restore

**Create backup:**
```bash
cd /volume3/docker/projects/resolution-tracker
sudo docker-compose exec app npm run db:backup
```

**Restore from backup:**
```bash
# List available backups
ls -lh backups/

# Restore specific backup
sudo docker-compose exec app npm run db:restore
# Then follow prompts to select backup file
```

## Migrations vs db:push

**Current workflow:** Using `db:push` (immediate schema sync, no migration files)

**To switch to migrations workflow:**
1. Generate migration: `npm run db:migrate:generate`
2. Review generated SQL in `drizzle/` folder
3. Apply migration: `npm run db:migrate`
4. On next container restart, migrations will run automatically

**Recommendation:** Keep using `db:push` for development/MVP. Switch to migrations before first production deployment with real user data.
