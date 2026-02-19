# CLAUDE.md — Cascade AI Workflow Automation Platform

## Project Overview

Cascade is an AI workflow automation platform for orchestrating and observing multi-step AI-driven workflows ("playbooks") across workspaces. It provides a web console for operators and a headless worker for background job execution.

**Status:** Early MVP (v0.1.0, ~50% complete). Test infrastructure exists but no tests are written yet.

## Architecture

**Monorepo** using pnpm workspaces + Turborepo.

```
cascade/
├── apps/
│   ├── console/       → Next.js 15 operator UI (port 3001)
│   └── worker/        → Node.js headless job executor (pg-boss queue)
├── packages/
│   ├── db/            → Prisma ORM client + schema (PostgreSQL)
│   ├── runtime/       → Workflow DAG execution engine
│   ├── schemas/       → Zod validation schemas + shared types
│   ├── business-utils/→ Prospect enrichment / lead management
│   └── config/
│       ├── eslint/    → Shared ESLint config
│       └── typescript/→ Shared TS configs (base + nextjs)
├── docs/              → Technical specs and design documents
└── playbooks/         → Business playbook assets (Money-OS program)
```

### How the System Works

1. **Console** (Next.js 15 App Router) — Operators create workspaces, define playbooks (DAG of typed nodes), configure triggers, and monitor runs
2. **Console enqueues** `execute-run` jobs to a pg-boss queue
3. **Worker** dequeues jobs, traverses the playbook DAG, executes each step (LLM, HTTP, branch, Slack, wait, transform), and records results
4. **Data layer** — PostgreSQL via Prisma on Supabase; auth via Supabase magic-link
5. **Secrets** — AES-256-GCM encrypted at rest per workspace

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) throughout |
| UI | React 19 + Next.js 15 (App Router, RSC, Server Actions) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Worker | Node.js ESM + pg-boss (at-least-once delivery, 3 retries) |
| ORM | Prisma 5 (PostgreSQL) |
| Validation | Zod |
| Auth | Supabase (magic-link) |
| Build | Turborepo + tsup (packages), Next.js compiler (console) |
| Runtime deps | mustache (templating), expr-eval (expressions) |
| Logging | pino + pino-pretty (worker) |

## Quick Reference — Commands

All commands run from the repository root unless noted.

| Command | What it does |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all apps/packages in dev mode (console on :3001) |
| `pnpm build` | Build everything via Turborepo |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Run `tsc --noEmit` across all packages |
| `pnpm test` | Run tests (Vitest, currently only in `@cascade/runtime`) |
| `pnpm format` | Format all `.ts`, `.tsx`, `.md`, `.json` files with Prettier |
| `pnpm db:generate` | Run `prisma generate` |
| `pnpm db:push` | Push schema to database (no migration file) |
| `pnpm db:migrate` | Run `prisma migrate dev` |
| `pnpm db:seed` | Seed database (depends on `db:generate`) |
| `pnpm clean` | Remove all build artifacts and `node_modules` |

### Package-specific commands

```bash
# Console
pnpm --filter @cascade/console dev      # Next.js dev server on port 3001
pnpm --filter @cascade/console build    # Production build

# Worker
pnpm --filter @cascade/worker dev       # tsx watch mode
pnpm --filter @cascade/worker build     # tsup build

# Database
pnpm --filter @cascade/db db:studio     # Open Prisma Studio
```

## Package Manager

**pnpm 9.15.0** — enforced via `packageManager` field in root `package.json` and corepack in Docker. Always use `pnpm`, never `npm` or `yarn`.

## Node Version

**Node.js >= 20.0.0** required (declared in `engines`).

## Code Style and Conventions

### TypeScript

- **Strict mode** enabled: `strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- Target: ES2022, Module: NodeNext (packages), Bundler (console)
- Use `type` imports: `import { type Foo } from './bar'` (enforced by ESLint `consistent-type-imports`)

### ESLint Rules

- `@typescript-eslint/recommended` + `prettier` integration
- **No unused variables** (prefix unused params/vars with `_` to suppress)
- **Import ordering** enforced: builtin → external → internal → parent/sibling → index, with alphabetical sorting and newlines between groups
- Ignored paths: `node_modules/`, `dist/`, `.next/`, `coverage/`

### Formatting

- Prettier 3.2 — run `pnpm format` before committing
- Applies to: `*.ts`, `*.tsx`, `*.md`, `*.json`

## Database

### Schema Location

`packages/db/prisma/schema.prisma`

### Key Models

- **User** → has many Workspaces
- **Workspace** → has Playbooks, Runs, Secrets, Guardrails, UsageLogs, Triggers, Content*
- **Playbook** → has PlaybookVersions (JSON `definition` = DAG graph), linked to Agent and Template
- **PlaybookVersion** → versioned playbook definitions, has Runs
- **Run** → execution instance with status (PENDING → RUNNING → SUCCEEDED/FAILED/CANCELED)
- **RunStep** → individual DAG node execution, keyed by `idempotencyKey`
- **Trigger** → MANUAL / WEBHOOK / SCHEDULE
- **Secret** → AES-256-GCM encrypted credentials per workspace
- **Guardrail** → per-workspace daily/per-run token and cost caps
- **Agent** → registered AI agent with slug, mission, system prompt
- **PlaybookTemplate** → reusable playbook templates by category
- **ContentPlan/ContentItem/ContentApproval** → content pipeline models

### Environment Variables

Database connection requires:
- `DATABASE_URL` — Prisma connection string (pooled)
- `DIRECT_DATABASE_URL` — Direct connection (for migrations)

## Project Structure — Key Paths

### Console App (`apps/console/`)

| Path | Purpose |
|---|---|
| `src/app/(auth)/` | Login page (magic-link) and auth callback |
| `src/app/(dashboard)/` | All operator pages: workspaces, playbooks, runs, agents, templates, activity |
| `src/app/api/` | Next.js API routes: auth, workspaces, playbooks, runs, secrets, agents, content |
| `src/components/ui/` | shadcn/ui primitives (badge, button, card, input, etc.) |
| `src/lib/auth.ts` | Auth helpers |
| `src/lib/crypto/secrets.ts` | AES-256-GCM encryption utilities |
| `src/lib/supabase/` | Supabase client/server/middleware helpers |
| `src/lib/queue.ts` | Queue interface for enqueuing jobs |
| `src/types/` | Centralized TypeScript interfaces |
| `src/middleware.ts` | Next.js middleware (auth) |
| `next.config.ts` | Transpiles workspace packages, Server Actions body limit: 2MB |

### Worker App (`apps/worker/`)

| Path | Purpose |
|---|---|
| `src/index.ts` | pg-boss worker entrypoint with graceful shutdown |
| `src/handlers/execute-run.ts` | Main DAG traversal loop with idempotency and retry |
| `src/executors/` | Per-node-type execution: `llm.ts`, `http.ts`, `branch.ts` |
| `src/connectors/` | External API wrappers: OpenAI, Slack, HTTP |

### Shared Packages

| Package | Key Exports |
|---|---|
| `@cascade/db` | Prisma client singleton (`packages/db/src/`) |
| `@cascade/runtime` | DAG parser, expression evaluator, template renderer, guardrails, cost calc |
| `@cascade/schemas` | Zod schemas for Playbook, Run, Workspace, common types |
| `@cascade/business-utils` | Google Maps enrichment, Supabase integration, CSV I/O |

## Turborepo Pipeline

- `build` depends on `^build` (build dependencies first)
- `lint`, `typecheck`, `test` depend on `^build`
- `dev` is persistent and uncached
- `db:seed` depends on `db:generate`
- All `db:*` tasks are uncached

## Deployment

| Target | App | Config |
|---|---|---|
| **Vercel** | Console (Next.js) | Standard Next.js deployment |
| **Fly.io** | Worker | `fly.toml` — app `cascade-darkness`, region `iad`, 1 CPU / 1 GB RAM |
| **Docker** | Worker | Multi-stage Dockerfile with corepack + pnpm |

## Testing

- **Framework:** Vitest v2
- **Current state:** Test infrastructure configured in `@cascade/runtime` only; no test files written yet
- **Run tests:** `pnpm test`
- **Coverage output:** `coverage/` directory

## CI/CD

Single GitHub Actions workflow (`.github/workflows/demo-workflow.yml`):
- **Trigger:** `workflow_dispatch` (manual) with `audience` and `run_tests` inputs
- **Steps:** checkout → pnpm setup → Node.js 20 → `pnpm install --frozen-lockfile` → lint → typecheck → test (conditional)
- No automated push/PR-triggered CI exists yet

## Common Workflows for AI Assistants

### Adding a new API route (Console)

1. Create route handler in `apps/console/src/app/api/<resource>/route.ts`
2. Use Zod schemas from `@cascade/schemas` for request validation
3. Use Prisma client from `@cascade/db` for database access
4. Follow existing patterns in `src/app/api/` for auth checks and error handling

### Adding a new page (Console)

1. Create page in `apps/console/src/app/(dashboard)/<section>/page.tsx`
2. Use React Server Components by default; add `'use client'` only when needed
3. Use shadcn/ui components from `src/components/ui/`
4. Follow existing layout patterns with sidebar navigation

### Adding a new workflow node type

1. Add executor in `apps/worker/src/executors/<type>.ts`
2. Add connector if external API needed in `apps/worker/src/connectors/`
3. Update DAG handler in `apps/worker/src/handlers/execute-run.ts`
4. Add Zod schema in `packages/schemas/`

### Modifying the database schema

1. Edit `packages/db/prisma/schema.prisma`
2. Run `pnpm db:generate` to regenerate the Prisma client
3. Run `pnpm db:migrate` for a migration or `pnpm db:push` for prototyping

### Adding a shared package

1. Create under `packages/<name>/` with `package.json` (name: `@cascade/<name>`, `private: true`)
2. Add `tsup.config.ts` for build configuration
3. Reference from consuming packages via `"@cascade/<name>": "workspace:*"`
4. The package will be auto-discovered via `pnpm-workspace.yaml`

## Important Notes

- All workspace packages use `workspace:*` protocol for internal dependencies
- All packages are `private: true` (not published to npm)
- The console runs on port **3001** (not the default 3000)
- Server Actions have a **2MB body size limit** configured in `next.config.ts`
- The worker uses **at-least-once delivery** with 3 retries and backoff
- Secrets are encrypted with **AES-256-GCM** — never store credentials in plaintext
- Guardrails enforce per-workspace daily and per-run token/cost caps
