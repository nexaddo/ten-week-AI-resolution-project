# Dev Container Setup

This project includes a dev container configuration that provides a consistent development environment with all necessary dependencies.

## What's Included

- **Node.js 20**: Latest LTS version
- **PostgreSQL 16**: Database server
- **VS Code Extensions**: Pre-configured extensions for TypeScript, React, Tailwind CSS, and more
- **Development Tools**: Git, PostgreSQL client, and other utilities

## Getting Started

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) in VS Code
3. Open this project in VS Code
4. When prompted, click "Reopen in Container" (or use Command Palette: `Dev Containers: Reopen in Container`)
5. Wait for the container to build and start (first time may take a few minutes)
6. The application will be available at `http://localhost:5000`

## What Happens Automatically

- `npm install` runs after container creation
- Database migrations run on container start
- PostgreSQL is available at `localhost:5432`
- Port 5000 is forwarded for the application

## Manual Commands

If you need to run commands manually:

```bash
# Navigate to project directory
cd resolution-tracker

# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Database Connection

- **Host**: localhost
- **Port**: 5432
- **Database**: resolutions
- **User**: postgres
- **Password**: postgres

## Troubleshooting

- If the container fails to start, try rebuilding: `Dev Containers: Rebuild Container`
- To view container logs: `Docker: View Logs`
- To reset the database, delete the docker volume: `docker volume rm devcontainer_postgres-data`
