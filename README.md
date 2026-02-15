# CASCADE - AI Workflow Automation Platform

**Mission-control console for orchestrating and observing AI workflow playbooks across organizations and workspaces.**

CASCADE is a TypeScript/Node.js monorepo that provides a comprehensive platform for building, executing, and monitoring AI-driven workflows with built-in guardrails, cost tracking, and multi-tenant support.

---

## 🏗️ Architecture

```
CASCADE/
├── apps/
│   ├── console/          Next.js 15 operator UI (Vercel)
│   └── worker/           Node.js headless job executor (Fly.io)
├── packages/
│   ├── config/           Shared configs (eslint, tailwind, typescript)
│   ├── db/              Prisma client + schema (Supabase PostgreSQL)
│   ├── runtime/         Workflow execution engine
│   └── schemas/         Zod types + validation schemas
└── docs/                 Project documentation
```

### Key Components

- **Console App** (`apps/console/`) - Next.js 15 application for managing workspaces, playbook definitions, runs, and guardrail configuration
- **Worker Service** (`apps/worker/`) - Node.js process that executes workflow jobs using pg-boss queue with at-least-once delivery semantics
- **Runtime Engine** (`packages/runtime/`) - Core workflow logic: DAG parsing, expression evaluation, template interpolation, and cost calculation
- **Database Layer** (`packages/db/`) - Prisma schema modeling users, workspaces, playbooks, runs, steps, guardrails, and encrypted secrets

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥20.0.0
- pnpm 9.15.0
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, API keys, etc.

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed development data (optional)
pnpm db:seed
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Or run individually:
cd apps/console && pnpm dev  # Console on http://localhost:3001
cd apps/worker && pnpm dev   # Worker in watch mode
```

### Build & Deploy

```bash
# Build all packages and apps
pnpm build

# Type check
pnpm typecheck

# Lint all code
pnpm lint

# Format with Prettier
pnpm format
```

### Demo Workflow for Potential Users

A GitHub Actions demo workflow is included at `.github/workflows/demo-workflow.yml` to help potential users validate the project quickly in a clean environment.

- Trigger it manually from **Actions → Demo Workflow → Run workflow**.
- Set `audience` (defaults to `potential-users`) for run context.
- Toggle `run_tests` to control whether lint/typecheck/test checks run.

To avoid run conflicts when multiple demos are launched on the same branch, the workflow uses `concurrency` with `cancel-in-progress: true`.

---

## 🎯 Features

### Current Implementation

✅ **Monorepo Infrastructure** - pnpm workspaces with Turbo build orchestration
✅ **Authentication** - Magic link passwordless auth with session management
✅ **Workspace Management** - Single-user mode with path to org multi-tenancy
✅ **Playbook Versioning** - Immutable workflow versions with JSON definitions
✅ **Step Executors** - LLM (OpenAI), HTTP requests, conditional branching
✅ **Connectors** - OpenAI, Slack, generic HTTP
✅ **Guardrails** - Token/cost caps with real-time tracking
✅ **Secrets Management** - AES-256-GCM encrypted credential storage
✅ **Database Schema** - Comprehensive Prisma models with proper indexing

### In Development

⚠️ **UI Pages** - Workspace list, playbook editor, run timeline
⚠️ **Workflow Engine** - Complete step execution with error handling
⚠️ **Triggers** - Manual, webhook, and scheduled execution
⚠️ **Observability** - Structured logging and metrics collection

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[SPEC-1-CASCADE.md](docs/SPEC-1-CASCADE.md)** - Complete technical specification (1005 lines)
- **[DESIGN-ENHANCEMENTS.md](docs/DESIGN-ENHANCEMENTS.md)** - UI/UX design proposals (1008 lines)
- **[AGENTS.md](docs/AGENTS.md)** - Agent system design and playbook registry
- **[INDEX.md](docs/INDEX.md)** - Directory structure and organization
- **[CASCADE1-README.md](docs/CASCADE1-README.md)** - Original scaffold documentation

---

## 🛠️ Technology Stack

| Layer      | Technology                       | Purpose                                |
| ---------- | -------------------------------- | -------------------------------------- |
| Frontend   | Next.js 15, React 19, TypeScript | Operator UI with server components     |
| Backend    | Node.js, TypeScript, ESM         | Workflow execution service             |
| Database   | PostgreSQL (Supabase), Prisma    | Data persistence and ORM               |
| Queue      | pg-boss                          | Job queue with at-least-once semantics |
| Validation | Zod                              | Type-safe schema validation            |
| Styling    | Tailwind CSS, shadcn/ui          | Modern UI components                   |
| Build      | Turbo, tsup, tsc                 | Monorepo orchestration                 |
| LLM        | OpenAI API                       | AI capabilities                        |

---

## 🗄️ Database Schema

Core models include:

- **Authentication** - User, Session, MagicLink
- **Workspaces & Playbooks** - Workspace, Playbook, PlaybookVersion
- **Execution** - Run, RunStep (with status tracking)
- **Triggers** - Manual, webhook, scheduled
- **Guardrails** - Token/cost limits, UsageLog
- **Secrets** - Encrypted storage with audit logs

See [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma) for complete schema.

---

## 📦 Package Structure

### Apps

- **@cascade/console** - Next.js 15 UI application
- **@cascade/worker** - Node.js workflow executor

### Packages

- **@cascade/db** - Prisma client and database utilities
- **@cascade/runtime** - Workflow execution engine
- **@cascade/schemas** - Zod schemas and TypeScript types
- **@cascade/config** - Shared configuration packages

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Slack (optional)
SLACK_BOT_TOKEN="xoxb-..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Encryption
ENCRYPTION_KEY="..." # 32-byte hex string

# Auth
SESSION_SECRET="..." # Random string
```

---

## 🧪 Development Workflow

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
```

### Database Management

```bash
pnpm db:generate       # Generate Prisma client
pnpm db:push           # Push schema changes
pnpm db:migrate        # Run migrations
pnpm db:seed           # Seed development data
pnpm db:studio         # Open Prisma Studio
```

### Code Quality

```bash
pnpm lint              # ESLint
pnpm typecheck         # TypeScript check
pnpm format            # Prettier formatting
```

---

## 🚢 Deployment

### Recommended Stack

- **Console**: Vercel (Next.js optimized)
- **Worker**: Fly.io (long-running processes)
- **Database**: Supabase (managed PostgreSQL)
- **Queue**: Supabase (pg-boss on PostgreSQL)

### Production Checklist

- [ ] Configure environment variables in deployment platform
- [ ] Run database migrations (`pnpm db:migrate`)
- [ ] Set up monitoring and alerting
- [ ] Configure CORS and security headers
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Enable SSL/TLS

---

## 📈 Project Status

**Version**: 0.1.0 (Early MVP)
**Implementation**: ~50% complete
**Git History**: 1 commit (initial scaffold)

### Next Steps

1. Complete console UI pages (workspaces, editor, timeline)
2. Implement worker execution engine with error handling
3. Add comprehensive test coverage
4. Implement observability and structured logging
5. Add rate limiting per workspace
6. Security audit and production hardening
7. Deploy to staging environment

---

## 🤝 Contributing

This is currently a private project. For questions or collaboration, please contact the project maintainers.

---

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Related Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [pg-boss Documentation](https://github.com/timgit/pg-boss)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Built with ❤️ for AI workflow automation**
