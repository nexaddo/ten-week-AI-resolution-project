# Database Migrations Guide

This guide explains how to safely manage database schema changes without losing data.

## Quick Reference

```bash
# Development: Safe push with automatic backup
npm run db:push

# Production: Use migrations
npm run db:migrate:generate  # Generate migration from schema changes
npm run db:migrate           # Apply migrations to database

# Emergency: Unsafe push (skip backup)
npm run db:push:unsafe
```

## Development Workflow

### Making Schema Changes

1. **Edit your schema** in `shared/schema.ts`
2. **Run safe push** (automatically creates backup):
   ```bash
   npm run db:push
   ```

The `db:push` command now:
- ✅ Automatically creates a backup before applying changes
- ✅ Shows you the backup filename
- ✅ Tells you how to restore if something goes wrong

### If Something Goes Wrong

Restore your backup:
```bash
npm run db:restore
# Select the backup file from the list
```

## Production Workflow (Recommended)

For production or when you need to preserve data across environments:

### 1. Generate Migration

After editing your schema:
```bash
npm run db:migrate:generate
```

This creates SQL migration files in the `drizzle/` directory.

### 2. Review Migration

Check the generated SQL in `drizzle/` to ensure it does what you expect.

### 3. Apply Migration

```bash
npm run db:migrate
```

This applies migrations safely without losing data.

## Migration Files

Migrations are stored in `drizzle/` directory:
```
drizzle/
├── 0000_initial_schema.sql
├── 0001_add_ai_tables.sql
├── 0002_add_prompt_tests.sql
└── meta/
    └── _journal.json
```

## Comparison: Push vs Migrate

| Feature | `db:push` | `db:migrate` |
|---------|-----------|--------------|
| Speed | Fast | Moderate |
| Data Safety | Risky (recreates tables) | Safe (preserves data) |
| Version Control | No | Yes (SQL files) |
| Rollback | Via backup | Via migration versions |
| Use Case | Development | Production |
| Team Collaboration | Difficult | Easy (commit migrations) |

## Best Practices

### Development
1. Use `npm run db:push` for quick iteration
2. Backups are automatic, but verify they're working
3. Before major changes, create manual backup: `npm run db:backup`

### Production
1. **Always use migrations** (`db:migrate:generate` + `db:migrate`)
2. **Never use `db:push`** in production
3. Review migration SQL before applying
4. Test migrations on staging first
5. Keep migrations in version control
6. Create manual backup before critical migrations

### Team Workflow
1. Edit schema in feature branch
2. Generate migration: `npm run db:migrate:generate`
3. Commit migration files to git
4. Team members run: `npm run db:migrate`
5. Everyone stays in sync

## Common Issues

### "Migration failed"
- Check database connection
- Review migration SQL for conflicts
- Ensure previous migrations have run

### "Backup failed"
- Check `pg_dump` is in PATH
- Verify database credentials
- Ensure `backups/` directory exists

### "Lost data after push"
- Restore from backup: `npm run db:restore`
- Next time, use migrations for important data

## Environment-Specific Notes

### Local Development (Current Setup)
- Using `drizzle-kit push` with automatic backups
- Suitable for rapid development
- Data loss risk is mitigated by backups

### Synology NAS Deployment
- Use migrations for deployment
- Set up automated daily backups
- Consider replication for critical data

## Examples

### Example 1: Add new field to existing table

**Edit schema:**
```typescript
export const resolutions = pgTable("resolutions", {
  // ... existing fields
  difficulty: text("difficulty"), // NEW FIELD
});
```

**Development approach:**
```bash
npm run db:push
# Backup created automatically
# Schema updated
```

**Production approach:**
```bash
npm run db:migrate:generate
# Review generated SQL
npm run db:migrate
# Applied safely without data loss
```

### Example 2: Add new table

**Edit schema:**
```typescript
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
});
```

**Development:**
```bash
npm run db:push
```

**Production:**
```bash
npm run db:migrate:generate
npm run db:migrate
```

## Rolling Back

### From Backup (Development)
```bash
npm run db:restore
# Select backup file
```

### From Migration (Production)
You'll need to:
1. Generate a new migration that reverses changes
2. Or manually write a rollback migration
3. Apply with `npm run db:migrate`

## Future Enhancements

Consider adding:
- Automated migration testing
- Seed data scripts
- Migration rollback commands
- CI/CD integration for migrations
- Database snapshots before deployments
