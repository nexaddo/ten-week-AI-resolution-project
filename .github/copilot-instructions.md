# Copilot Instructions - Resolution Tracker

## Project Overview
**Resolution Tracker** is a full-stack web app for tracking New Year's resolutions during the 10-week AIDB program. Core entities: Users → Resolutions → Milestones + Check-ins (progress tracking).

## Code Quality & Style Standards

### Markdown Files
All markdown files must follow [markdownlint](https://github.com/DavidAnson/markdownlint) rules defined in `.markdownlintrc.json`:
- **Line length**: Max 120 characters (except code blocks)
- **Heading style**: Consistent (ATX style: `# Heading`)
- **List indentation**: 2 spaces
- **HTML allowed**: Inline HTML is permitted in markdown
- **Duplicate headings**: Allowed when nested differently

Install the [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) for VS Code to get real-time linting feedback.

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

## Completion Verification
Before declaring any task complete, **always run the following checks**:

```bash
cd resolution-tracker
npm run check    # TypeScript compilation check - must pass with no errors
npm test         # Run all tests - must pass with no failures
```

Both commands must complete successfully before telling the user that work is complete. This ensures:
- No TypeScript type errors or compilation issues
- All existing tests continue to pass
- No regressions introduced by changes
- After the checks pass, create a git commit with a clear, descriptive message and push it to the current branch before declaring the work complete.

For markdown files, verify they pass markdownlint validation:
- Install the markdownlint extension in VS Code for real-time feedback
- Or run the [markdownlint CLI](https://github.com/DavidAnson/markdownlint): `markdownlint "**/*.md"`
- Configuration is in `.markdownlintrc.json`

## Shell and OS Compatibility

**Before running any shell commands**, check the user's OS from the environment info:
- **Windows**: Use PowerShell syntax (available shells: PowerShell, cmd)
  - PowerShell string escaping: Use single quotes `'...'` for literal strings with backticks
  - Use `@'...'@` (here-strings) for multi-line strings with special characters
  - Backticks are escape characters in PowerShell (e.g., `` `n `` = newline)
  - Use double quotes with escaping only when variable interpolation is needed
- **macOS/Linux**: Use bash/zsh syntax
  - Standard bash string escaping with single/double quotes
  - Use `\` for escaping special characters

**Command format examples**:
```powershell
# PowerShell (Windows)
Get-ChildItem -Path "C:\folder"
$env:VAR = "value"
'String with `backticks` needs single quotes'
```

```bash
# Bash (macOS/Linux)
ls -la /folder
export VAR="value"
echo "String with \$variable"
```

## Critical Details
- **No authentication currently implemented** (passport imported but unused)
- **In-memory storage**: data lost on server restart; migration to database pending
- **Route scope**: Currently single-user (no user ID in resolutions); auth/multi-tenant not integrated
- **Env vars**: `NODE_ENV` (dev/production), `DATABASE_URL` (if using Postgres)
