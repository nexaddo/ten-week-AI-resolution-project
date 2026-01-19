FROM node:18-alpine

# Install PostgreSQL client for backups
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY dist ./dist
COPY shared ./shared
COPY drizzle.config.ts ./

# Copy scripts for database operations
COPY script/backup-db.ts ./script/
COPY script/restore-db.ts ./script/
COPY script/migrate.ts ./script/

# Create backups directory
RUN mkdir -p /app/backups

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/index.js"]
