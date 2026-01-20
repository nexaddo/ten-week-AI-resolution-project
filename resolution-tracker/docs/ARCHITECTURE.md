# Personal Resolution Tracker - Architecture Overview

## Overview

A personal goal-tracking web application that helps users create, monitor, and achieve their New Year's resolutions and personal goals. The app features a dashboard with resolution cards, progress tracking, milestone management, check-in logging, and achievement badges. Built with a clean, productivity-focused design inspired by Linear and Notion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Design System**: Inter font family, card-based layouts, color-coded category badges

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Build Process**: esbuild for server bundling, Vite for client bundling

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod with drizzle-zod for runtime validation
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Current Storage**: In-memory storage implementation (MemStorage) for development, designed to be swapped for database storage

### Key Data Models
- **Users**: Basic authentication with username/password
- **Resolutions**: Goals with title, description, category, status, target date, and progress percentage
- **Milestones**: Sub-goals linked to resolutions with completion tracking
- **Check-ins**: Progress logs with notes and timestamp

### Category System
Six predefined categories with color coding:
- Health & Fitness, Career, Learning, Finance, Relationships, Personal Growth

### Status Workflow
Four resolution states: not_started → in_progress → completed (or abandoned)

## External Dependencies

### Database
- PostgreSQL database required (connection via DATABASE_URL environment variable)
- Drizzle Kit for database migrations (`npm run db:push`)

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `date-fns`: Date manipulation and formatting
- `lucide-react`: Icon library
- `wouter`: Client-side routing
- `zod`: Schema validation
- Full shadcn/ui component set via Radix UI primitives

### Development Tools
- Vite dev server with HMR
- TypeScript for type safety
- Replit-specific plugins for development environment
