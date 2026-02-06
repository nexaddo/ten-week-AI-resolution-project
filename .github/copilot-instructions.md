# Copilot Instructions - Resolution Tracker

## Project Overview

**Resolution Tracker** is a full-stack web app for tracking New Year's resolutions during
the 10-week AIDB program. Core entities: Users → Resolutions → Milestones + Check-ins.
Additional features: AI-powered insights, prompt playground, model map, and analytics.
All source lives inside `resolution-tracker/`.

## Code Style

- **TypeScript strict mode** — `tsconfig.json` enforces `"strict": true`, `"noEmit": true`
- **Path aliases**: `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- **File naming**: kebab-case for files (`add-resolution-dialog.tsx`), PascalCase for exports
- **Shadcn/UI style**: `"new-york"` variant; use `cn()` (`twMerge(clsx(...))`) for class merging
- **Markdown**: Must pass markdownlint rules in `.markdownlintrc.json` (max 120 chars, ATX headings,
  2-space list indent). Install the markdownlint VS Code extension.

## Architecture

Three-layer monorepo inside `resolution-tracker/`:

### Shared (`shared/`)

Single source of truth for types and DB schema:

- `schema.ts` — Drizzle `pgTable()` definitions, Zod insert schemas via `createInsertSchema()`,
  TypeScript types via `z.infer<>` and `$inferSelect`. Re-exports from `models/auth.ts`
  and `models/modelMap.ts`.
- Enum-like values use `as const` arrays (`categories`, `statuses`, `favoriteTypes`, `speedRatings`)
- IDs: UUIDs via `gen_random_uuid()`. Date fields currently `text` (future: `timestamp`).

### Backend (`server/`)

- **Express.js** with `tsx` runner, port 5000
- **Two storage interfaces**:
  - `IStorage` in `storage.ts` — core app CRUD (~60 methods). Implementations: `MemStorage`
    (dev/test) and `DatabaseStorage` (Drizzle ORM queries).
  - `IModelMapStorage` in `modelMapStorage.ts` — AI model map feature with separate storage.
- **Routes** (`routes.ts`): RESTful CRUD at `/api/*`. Zod validation on all payloads.
  Protected by `isAuthenticated` middleware; admin routes use `isAdmin`.
  Rate limiting via `express-rate-limit`.
- **AI layer** (`ai/`): Strategy pattern with `AIProvider` interface; implementations for
  Anthropic, OpenAI, Google. `orchestrator.ts` selects models. `promptTester.ts` runs
  prompts across multiple models. `costCalculator.ts` uses per-million-token pricing.
- **Auth** (`auth_integrations/auth/`): Multi-provider OAuth (Google OIDC, GitHub, Apple).
  Sessions via `express-session` + `connect-pg-simple` (7-day TTL).

### Frontend (`client/src/`)

- **React + TypeScript**, Wouter routing, TanStack React Query for server state
- **UI**: Shadcn/UI (Radix primitives) + Tailwind CSS with dark mode (`next-themes`)
- **Auth-aware rendering**: unauthenticated → Landing page; authenticated → sidebar layout
- `apiRequest()` from `lib/queryClient.ts` — centralized fetch with `credentials: 'include'`
- QueryClient: `staleTime: Infinity`, `retry: false`, `refetchOnWindowFocus: false`
- Category colors hardcoded in `lib/categories.ts` with light/dark variants

## Build and Test

All commands run from `resolution-tracker/`:

```bash
npm install              # Install dependencies
npm run dev              # Express + Vite dev server on port 5000
npm run check            # TypeScript type-check (no emit)
npm test                 # vitest run — all tests once
npm run test:watch       # vitest watch mode
npm run test:coverage    # vitest with v8 coverage
npm run build            # Production build → dist/
npm start                # Run production build (NODE_ENV=production)
npm run db:push          # Safe schema push via tsx script/safe-db-push.ts
npm run db:migrate       # Run migrations
npm run db:seed          # Seed sample data
npm run docker:up        # docker compose up with .env
npm run build:docker     # Build Docker image
```

## Project Conventions

### API Routes

- All protected routes use `isAuthenticated` middleware; user ID from `req.user.claims.sub`
- Validation: `insertXSchema.parse(req.body)` for POST, `insertXSchema.partial().parse()` for PATCH
- Error pattern: `z.ZodError` → 400, general `Error` → 500
- Activity logging via `storage.logUserActivity()` after mutations
- AI analysis triggered asynchronously on check-in creation (non-blocking)

### Testing

- **Framework**: Vitest with jsdom, globals enabled
- **Test files**: `*.{test,spec}.{ts,tsx}` alongside source
- **Custom render**: `client/src/test/test-utils.tsx` wraps components in
  `QueryClientProvider` + `ThemeProvider`. Import `render` from there, not `@testing-library/react`.
- **`data-testid` naming**: prefix by type — `button-*`, `text-*`, `badge-*`, `card-*`,
  `input-*`, `select-*`, `slider-*`, `filter-*`, `nav-*`, `menu-item-*`
- **Schema tests**: Validate Zod schemas with `.safeParse()`, use `it.each()` for parameterized tests
- **Storage tests**: Test `MemStorage` directly, fresh instance in `beforeEach`
- **Coverage excludes**: `client/src/components/ui/**` (shadcn), entry points, type-only files
- **User interactions**: `userEvent.setup()` + `user.click()` pattern

### Component Organization

- Dialogs: `add-resolution-dialog.tsx`, `check-in-dialog.tsx` (controlled modals with form state)
- Cards: `resolution-card.tsx`, `stats-cards.tsx` (read-only display)
- Utilities: `progress-bar.tsx`, `category-badge.tsx`, `status-badge.tsx` (reusable wrappers)
- UI primitives: `components/ui/` — Shadcn/UI, do not edit manually

### Data Flow

- **Schema changes** → modify `shared/schema.ts` (or `shared/models/*.ts`), update Zod schemas +
  types, run `npm run db:push` if DB-backed
- **API routes** → add/modify in `server/routes.ts`, add corresponding `IStorage` methods
- **Storage** → implement in `storage.ts` (`MemStorage` + `DatabaseStorage`); model map feature
  uses separate `modelMapStorage.ts`
- **React components** → use `apiRequest()` + React Query hooks from `lib/queryClient.ts`

## Security

- OAuth multi-provider (Google, GitHub, Apple) with PostgreSQL-backed sessions
- `isAuthenticated` middleware on all `/api/*` protected routes
- `isAdmin` middleware gates admin-only endpoints
- User-scoped data: all queries filter by `userId` — ownership verified before mutations
- Rate limiting: 1000 req/15min global, 100 req/15min on milestone endpoints
- `trust proxy` enabled for reverse proxy deployments (Synology NAS / Docker)

## Environment Variables

Key vars (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (default: `localhost:5432/resolutions`) |
| `SESSION_SECRET` | Session encryption key (required in production) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_AI_API_KEY` | AI provider keys |
| `AI_STRATEGY` | Model selection: `all` / `rotate` / `single` |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub OAuth |

## Agent Skills

This workspace uses the [Skills CLI](https://skills.sh/) (`npx skills`) for extensible
agent knowledge. Skills are in `.agents/skills/` (workspace-level) and
`~/.agents/skills/` (user-level).

### Installed Skills

| Skill | When to Use |
|---|---|
| `vercel-react-best-practices` | Writing, reviewing, or refactoring React components — performance patterns, data fetching, bundle optimization |
| `vercel-composition-patterns` | Refactoring components with boolean prop sprawl, designing compound components, render props, context providers |
| `web-design-guidelines` | UI review requests — "review my UI", "check accessibility", "audit design", "review UX" |
| `vercel-react-native-skills` | React Native / Expo work — mobile components, list perf, animations, native modules (not used in this project) |
| `find-skills` (user-level) | When the user asks "how do I do X" and no installed skill covers it — search for new skills |

### Using Skills

Read the skill's `SKILL.md` file before applying it. Skills are automatically listed in
the `<skills>` section of the system prompt — match user requests to the skill descriptions.

### Discovering New Skills

When a user asks for help with a domain not covered by installed skills, search for one:

```bash
npx skills find [query]           # Search by keyword
npx skills add <owner/repo@skill> # Install a skill
npx skills check                  # Check for updates
```

Browse available skills at **https://skills.sh/**.

## Completion Verification

Before declaring any task complete, **always run**:

```bash
cd resolution-tracker
npm run check    # TypeScript — must pass with no errors
npm test         # All tests — must pass with no failures
```

After both pass, create a git commit with a clear message and push to the current branch.

## Shell and OS Compatibility

Check the user's OS from environment info before running commands:

- **Windows (PowerShell)**: Single quotes for literals with backticks; `@'...'@` for here-strings;
  backtick is the escape character
- **macOS/Linux (bash)**: Standard quoting; `\` for escaping
