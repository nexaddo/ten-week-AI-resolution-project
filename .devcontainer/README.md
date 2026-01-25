# Dev Container Setup

This project includes a dev container configuration that provides a consistent development environment with all necessary dependencies. Perfect for developing the Resolution Tracker full-stack application with React frontend, Express backend, and PostgreSQL database.

## 🚀 Quick Start (2 minutes)

**Prerequisites**: Docker Desktop and VS Code installed

1. **Open the project folder** in VS Code
2. **Click the popup** that appears: "Reopen in Container" (or run `Dev Containers: Reopen in Container` from the Command Palette)
3. **Wait 2-3 minutes** for the container to build and start
4. **The app is ready!**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Database: localhost:5432

That's it! The setup handles everything automatically.

## What's Included

- **Node.js 20**: Latest LTS version
- **PostgreSQL 16**: Alpine-based database server with health checks
- **VS Code Extensions**: 30+ pre-configured extensions for TypeScript, React, Tailwind CSS, Docker, Git, AI, testing, and more
- **Development Tools**: Git, PostgreSQL client, curl, wget, build tools, Python 3, and tsx CLI
- **Global Packages**: pnpm, npm-check-updates, and tsx for script execution

## Getting Started (Detailed)

1. **Install prerequisites**:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open the project**:
   - Clone the repository: `git clone https://github.com/nexaddo/ten-week-AI-resolution-project.git`
   - Open the folder in VS Code
   - Navigate to the `.devcontainer` folder (this is where the Docker config lives)

3. **Start the container**:
   - A blue popup will appear asking "Reopen in Container"
   - Click it, or use Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → `Dev Containers: Reopen in Container`

4. **Wait for setup**:
   - First startup takes 2-3 minutes (builds Docker image, installs dependencies)
   - Subsequent startups are faster (30 seconds)
   - Watch the terminal for progress

5. **Verify everything is running**:
   - All terminals should show "Ready" messages
   - PostgreSQL health check should show as "healthy"
   - Navigate to http://localhost:5173 to see the app

## Quick Reference

### Start Development

```bash
cd resolution-tracker
npm run dev
```

Then visit:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### Common Tasks

```bash
# Install new dependencies
npm install

# Type check your code
npm run check

# Run tests
npm test
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Database
npm run db:push         # Run migrations
npm run db:seed         # Add sample data
npm run db:backup       # Create backup
npm run db:restore      # Restore from backup
```

### VS Code Commands

Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette:

- `Dev Containers: Rebuild Container` - Rebuild from scratch
- `Dev Containers: Reopen Locally` - Exit dev container
- `Docker: View Logs` - See container logs
- `Remote-Containers: Open Folder in Container` - Open another project in container

## What Happens Automatically

- `npm install` runs after container creation (postCreateCommand)
- Database migrations run on container start (postStartCommand)
- PostgreSQL is available at `localhost:5432` with proper health checks
- Port 5000 is forwarded for the Express backend API
- Port 5173 is forwarded for the Vite development server
- Database waits for PostgreSQL to be healthy before starting the app
- VS Code extensions are automatically installed

## Troubleshooting

### "Reopen in Container" popup doesn't appear
- Ensure the Dev Containers extension is installed
- Restart VS Code
- Try Command Palette: `Dev Containers: Open Folder in Container`

### Container build fails
```bash
# Rebuild everything from scratch
Dev Containers: Rebuild Container

# If that doesn't work, delete the container entirely
docker compose down --volumes
# Then reopen in container
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker ps  # Look for postgres container

# View detailed logs
docker compose logs postgres

# Reset database
docker volume rm devcontainer_postgres-data
```

### Port already in use
```powershell
# Windows: Find what's using the port
Get-NetTCPConnection -LocalPort 5432 | Get-Process

# Stop all containers
docker compose down
```

### App loads but shows errors
1. Check the VS Code terminal for error messages
2. Try: `npm run check` (TypeScript check)
3. Try: `npm run db:push` (run migrations)
4. Restart the dev server: `npm run dev`

### Slow startup or install
```bash
# Use faster package manager
pnpm install

# Clear npm cache
npm cache clean --force

# Rebuild (may help)
Dev Containers: Rebuild Container
```

## Manual Commands (if you need them)

If you need to run commands manually:

```bash
# Navigate to project directory
cd resolution-tracker

# Install dependencies
npm install

# Type checking
npm run check

# Run database migrations (safe version)
npm run db:push

# Start development server (runs both frontend and backend)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Database operations
npm run db:backup    # Create database backup
npm run db:restore   # Restore from backup
npm run db:seed      # Seed database with sample data
```

## Reference

### Database Connection

**Details:**
- **Host**: postgres (from within containers) or localhost (from host machine)
- **Port**: 5432
- **Database**: resolutions
- **User**: postgres
- **Password**: postgres

**Connection Strings:**
```
# From within dev container:
postgresql://postgres:postgres@postgres:5432/resolutions

# From host machine:
postgresql://postgres:postgres@localhost:5432/resolutions
```

### Ports & Services

| Service | Port | Purpose |
|---------|------|---------|
| Express Backend API | 5000 | REST API endpoints |
| Vite Dev Server | 5173 | React frontend with HMR |
| PostgreSQL Database | 5432 | Application database |

### Environment Variables

**Always available:**
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: development
- `SESSION_SECRET`: dev-secret-key-change-in-production
- `AI_STRATEGY`: all
- `AI_ENABLE_ANALYSIS`: true

**Optional (add to `.env` if testing):**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`

## VS Code Recommended Settings

The dev container includes these settings:

- **Format on Save**: Enabled (Prettier)
- **Default Formatter**: Prettier (esbenp.prettier-vscode)
- **TypeScript SDK**: Uses workspace version
- **File Exclusions**: node_modules, dist, build, .git

## Performance Tips

- Use the `--watch` flag for development: `npm run test:watch`
- Enable VS Code's built-in TypeScript checking
- Clear VS Code cache if experiencing slowness: delete `.vscode-server` folder in container
- Use `docker system prune` periodically to clean up unused images and volumes
