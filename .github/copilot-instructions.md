# Copilot Instructions - Resolution Tracker

## Project Overview
**Resolution Tracker** is a full-stack web app for tracking New Year's resolutions during the 10-week AIDB program. Core entities: Users → Resolutions → Milestones + Check-ins (progress tracking).

## Architecture Layers

### Frontend (`client/src/`)
- **Framework**: React + TypeScript with Wouter routing
- **UI**: Shadcn/UI components (Radix primitives) + Tailwind CSS
- **State**: TanStack React Query for server state, useState for UI state
- **Key lib**: `lib/categories.ts` defines resolution categories with color/icon mappings
- **Entry point**: `App.tsx` wraps app in QueryClientProvider, ThemeProvider, sets up sidebar navigation

### Backend (`server/`)
- **Framework**: Express.js (Node.js with tsx/module support)
- **Storage**: Abstract `IStorage` interface (default: `MemStorage` in-memory, can be swapped to database)
- **Routes**: RESTful CRUD endpoints in `routes.ts` (resolutions, milestones, check-ins)
- **Validation**: Zod schemas from `shared/schema.ts` for all payloads

### Shared (`shared/schema.ts`)
- **Single source of truth**: Defines all data types and Zod schemas
- Categories: "Health & Fitness", "Career", "Learning", "Finance", "Relationships", "Personal Growth"
- Statuses: "not_started", "in_progress", "completed", "abandoned"
- Tables: `users`, `resolutions`, `milestones`, `checkIns` (though currently using in-memory storage)

## Development Workflows

### Local Development
```bash
cd resolution-tracker
npm install
npm run dev  # Starts Express server + Vite dev server on port 5173
```

### Database (PostgreSQL required)
```bash
npm run db:push  # Pushes schema changes via Drizzle kit
```
- Schema file: `shared/schema.ts`
- Config: `drizzle.config.ts` reads `DATABASE_URL` env var
- Migrations stored in `migrations/` directory

### Build & Deployment
```bash
npm run build    # Compiles server to dist/, frontend to dist/public/
npm start        # Runs production build (requires NODE_ENV=production)
npm run check    # TypeScript check without emit
```

## Key Patterns & Conventions

### API Request Pattern
- Client uses `apiRequest()` from `lib/queryClient.ts` to make typed fetch calls
- All requests include `credentials: 'include'` for session handling
- Errors thrown if response not ok (status >= 400)

### React Query Usage
- Hook pattern: `const { data, isLoading } = useQuery({ queryKey: [...], queryFn: async () => {...} })`
- Mutations use `useMutation()` with optimistic updates where applicable
- Query client configured in `lib/queryClient.ts`

### Component Organization
- Dialog components: `add-resolution-dialog.tsx`, `check-in-dialog.tsx` (controlled modals with form states)
- Cards & displays: `resolution-card.tsx`, `stats-cards.tsx` (read-only or minimal interaction)
- Utilities: `progress-bar.tsx`, `category-badge.tsx`, `status-badge.tsx` (reusable styled wrappers)
- Sidebar: `app-sidebar.tsx` with category filtering state passed from App.tsx

### Tailwind + Dark Mode
- Theme provider wraps app (`theme-provider.tsx` uses next-themes)
- All colors support light/dark variants: `bg-emerald-100 dark:bg-emerald-900/30`
- Category colors hardcoded in `lib/categories.ts`

### Data Validation
- Client-side: Zod schemas imported from `@shared/schema`
- Server-side: Parse request body with schema, return 400 + validation errors if invalid
- Example: `insertResolutionSchema.parse(req.body)` in POST `/api/resolutions`

## File Responsibility Map
- **Schema changes** → modify `shared/schema.ts`, update Zod schemas + TypeScript types, push DB if needed
- **API routes** → add/modify in `server/routes.ts`, ensure validation + error handling
- **Storage logic** → implement in `storage.ts` (MemStorage or swap for database driver)
- **React components** → follow naming: `ComponentName.tsx`, use Shadcn UI primitives
- **Client-side requests** → use `apiRequest()` + React Query hooks from `lib/queryClient.ts`

## Critical Details
- **No authentication currently implemented** (passport imported but unused)
- **In-memory storage**: data lost on server restart; migration to database pending
- **Route scope**: Currently single-user (no user ID in resolutions); auth/multi-tenant not integrated
- **Env vars**: `NODE_ENV` (dev/production), `DATABASE_URL` (if using Postgres)
