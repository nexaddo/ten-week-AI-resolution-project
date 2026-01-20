#!/bin/sh
set -e

echo "🚀 Starting Resolution Tracker..."

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate || echo "⚠️  Migrations skipped (no migrations folder or failed)"

echo "✅ Startup checks complete. Starting application..."

# Start the application
exec "$@"
