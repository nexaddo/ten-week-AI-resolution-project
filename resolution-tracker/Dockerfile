# Build stage - includes dev dependencies for building
FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
# Use npm install instead of npm ci due to optional dependency sync issues
RUN npm install

# Copy source code
COPY . .

# Build the application (client + server)
RUN npm run build

# Production stage - only runtime dependencies
FROM node:25-alpine

# Install PostgreSQL client for backups and create non-root user
RUN apk add --no-cache postgresql-client && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (keep tsx and drizzle-kit for migrations)
# Use npm install instead of npm ci due to optional dependency sync issues
RUN npm install --omit=dev --omit=optional && \
    npm install drizzle-kit tsx && \
    npm cache clean --force && \
    chown -R nodejs:nodejs /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy configuration and scripts
COPY --chown=nodejs:nodejs drizzle.config.ts ./
COPY --chown=nodejs:nodejs script/backup-db.ts ./script/
COPY --chown=nodejs:nodejs script/restore-db.ts ./script/
COPY --chown=nodejs:nodejs script/migrate.ts ./script/
COPY --chown=nodejs:nodejs script/safe-db-push.ts ./script/

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create backups directory with proper ownership
RUN mkdir -p /app/backups && \
    chown nodejs:nodejs /app/backups

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Set entrypoint to run migrations before starting app
ENTRYPOINT ["docker-entrypoint.sh"]

# Start application
CMD ["node", "dist/index.js"]
