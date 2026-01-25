# Dev Container Setup

This project includes a dev container configuration that provides a consistent development environment with all necessary dependencies. Perfect for developing the Resolution Tracker full-stack application with React frontend, Express backend, and PostgreSQL database.

## What's Included

- **Node.js 20**: Latest LTS version
- **PostgreSQL 16**: Alpine-based database server with health checks
- **VS Code Extensions**: 30+ pre-configured extensions for TypeScript, React, Tailwind CSS, Docker, Git, AI, testing, and more
- **Development Tools**: Git, PostgreSQL client, curl, wget, build tools, Python 3, and tsx CLI
- **Global Packages**: pnpm, npm-check-updates, and tsx for script execution

## Getting Started

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) in VS Code
3. Open this project in VS Code
4. When prompted, click "Reopen in Container" (or use Command Palette: `Dev Containers: Reopen in Container`)
5. Wait for the container to build and start (first time may take a few minutes)
6. The application will be available at `http://localhost:5000`

## What Happens Automatically

- `npm install` runs after container creation (postCreateCommand)
- Database migrations run on container start (postStartCommand)
- PostgreSQL is available at `localhost:5432` with proper health checks
- Port 5000 is forwarded for the Express backend API
- Port 5173 is forwarded for the Vite development server
- Database waits for PostgreSQL to be healthy before starting the app
- VS Code extensions are automatically installed

## Manual Commands

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

## Database Connection

- **Host**: postgres (from within containers) or localhost (from host machine)
- **Port**: 5432
- **Database**: resolutions
- **User**: postgres
- **Password**: postgres

### Connection String
From within the dev container:

```bash
postgresql://postgres:postgres@postgres:5432/resolutions
```

From host machine:

```bash
postgresql://postgres:postgres@localhost:5432/resolutions
```

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| Express Backend | 5000 | REST API endpoints |
| Vite Dev Server | 5173 | React frontend (HMR enabled) |
| PostgreSQL | 5432 | Database connection |

## Environment Variables

The dev container includes default values for common environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to `development`
- `SESSION_SECRET`: Development secret (change in production)
- `AI_STRATEGY`: AI model strategy (defaults to `all`)
- `AI_ENABLE_ANALYSIS`: Enable AI analysis features (defaults to `true`)

Optional OAuth and AI API keys can be set in `.env` if testing those features:

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- GitHub OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Apple OAuth: `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`
- AI APIs: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`

## Troubleshooting

### Container fails to start

```bash
# Rebuild the container from scratch
Dev Containers: Rebuild Container
```

### Database connection errors

```bash
# Check if PostgreSQL service is running
Docker: View Logs

# Verify health status (should be "healthy")
docker ps

# Manual database reset
docker volume rm devcontainer_postgres-data
```

### Port already in use

```bash
# Find process using the port (Windows PowerShell)
Get-NetTCPConnection -LocalPort 5432 | Get-Process

# Or stop all containers
docker compose down
```

### Slow npm install

- Use `pnpm` instead: `pnpm install` (faster, already installed globally)
- Clear npm cache: `npm cache clean --force`

### Extensions not installing

- Rebuild the dev container
- Check VS Code version (ensure it's up to date)
- Try manually installing from VS Code Extensions marketplace

## VS Code Recommended Settings

The dev container includes these settings:

- **Format on Save**: Enabled (Prettier)
- **Default Formatter**: Prettier (esbenp.prettier-vscode)
- **TypeScript SDK**: Uses workspace version
- **File Exclusions**: node_modules, dist, build, .git

## Accessing the Application

1. **Frontend**: Open browser and navigate to `http://localhost:5173`
2. **Backend API**: `http://localhost:5000`
3. **Database**: Connect with PostgreSQL client to `localhost:5432`

## Performance Tips

- Use the `--watch` flag for development: `npm run test:watch`
- Enable VS Code's built-in TypeScript checking
- Clear VS Code cache if experiencing slowness: delete `.vscode-server` folder in container
- Use `docker system prune` periodically to clean up unused images and volumes
