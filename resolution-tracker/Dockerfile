# Build stage - includes dev dependencies for building
FROM node:20-alpine AS builder

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
FROM node:20-alpine

# Install PostgreSQL client for backups
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
# Use npm install instead of npm ci due to optional dependency sync issues
RUN npm install --omit=dev --omit=optional

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Copy configuration and scripts
COPY drizzle.config.ts ./
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
