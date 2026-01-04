# Local Development Setup Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16 running locally or in Docker

## Setup Steps

### 1. Install Dependencies

```bash
cd resolution-tracker
npm install
```

### 2. Set Up Database Connection

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=resolutions \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Option B: Using Local PostgreSQL

Make sure PostgreSQL is running and the default connection works:
```
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: resolutions
```

### 3. Create `.env` File

Copy the example and adjust as needed:

```bash
cp .env.example .env
```

The default `.env.example` already includes a working local development connection:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resolutions
```

### 4. Set Up Database Schema

```bash
npm run db:push
```

This will create all necessary tables based on the schema.

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://postgres:postgres@localhost:5432/resolutions` | PostgreSQL connection string |
| `SESSION_SECRET` | Yes (production) | - | Secret key for session encryption |
| `NODE_ENV` | No | `development` | Environment (development/production) |
| `PORT` | No | `5000` | Server port |

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check that the database user/password are correct
- Verify the database exists

### DATABASE_URL Not Set
- If not using a `.env` file, set it manually:
  ```bash
  # Windows PowerShell
  $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/resolutions"
  npm run dev
  
  # Linux/Mac
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resolutions"
  npm run dev
  ```

### Database Schema Out of Sync
```bash
npm run db:push  # Apply pending migrations
```

## Using Dev Containers

To run in a containerized environment, VS Code will automatically handle DATABASE_URL setup. See `.devcontainer/README.md` for details.
