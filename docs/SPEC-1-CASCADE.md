# SPEC-1-CASCADE: Mission Control Console & Worker

## Background

CASCADE is a mission-control system to define, orchestrate, and observe AI workflow "playbooks" across organizations and workspaces. The platform provides:

- **Operator UI** (Next.js 15) for managing workspaces, playbooks, run timelines, and guardrail policies
- **Headless Worker Service** that pulls jobs from a queue and executes workflow DAGs step-by-step
- **Shared Workflow Runtime Library** consumed by both console and worker for parsing definitions, stepping through nodes, and invoking LLMs/tools
- **Shared Zod Types/Schemas** to guarantee consistency across apps
- **Postgres Schema** (via Prisma) modeling orgs, workspaces, playbooks, runs, steps, guardrails, and connectors

Initial MVP thrust focuses on: setting up monorepo workspaces and dependencies, wiring Prisma to Postgres with seed data, enabling authentication and org-scoped multi-tenancy, shipping three core pages (workspaces list, JSON playbook editor, run timeline), implementing a basic workflow engine (LLM calls, HTTP calls, simple branching), and enforcing cost/token guardrails surfaced in the UI.

---

## Requirements

### MoSCoW (end-customer product, initial "founder mode" = single user)

#### Must

| ID | Requirement |
|----|-------------|
| R-M1 | Single-user operator mode with easy path to org multi-tenant later |
| R-M2 | Playbook editor (JSON + schema validation) for nodes: LLM call, HTTP request, If/Else branch |
| R-M3 | Connectors: OpenAI (chat/completions), Slack (bot DM + channel post), Postgres (read/write via safe queries) |
| R-M4 | Run Timeline UI: step logs, inputs/outputs, errors, retries; downloadable run artifact |
| R-M5 | Guardrails: per-run token and cost caps; live counters; hard-stop + alert to Slack on breach |
| R-M6 | Secrets management per workspace; encryption at rest; secret usage audit log |
| R-M7 | Minimal auth suitable for founder mode (passwordless magic link); secure session, CSRF/SSR protections |
| R-M8 | Worker executes steps with at-least-once semantics; idempotency keys; exponential backoff |
| R-M9 | Observability: structured logs persisted; failure alerts to Slack; health endpoint |

#### Should

| ID | Requirement |
|----|-------------|
| R-S1 | Org-scoped multi-tenancy with basic roles (Owner, Admin, Member) |
| R-S2 | Versioned playbooks (draft → published → immutable versions) with run pinned to version |
| R-S3 | Triggers: manual, webhook, and simple cron |
| R-S4 | Basic rate limits per workspace; burst + sustained |
| R-S5 | P95 step latency target ≤ 2s (excluding LLM time); concurrent runs ≥ 20 |

#### Could

| ID | Requirement |
|----|-------------|
| R-C1 | Template gallery for common playbooks |
| R-C2 | Additional connectors (Notion, Google Drive, Gmail) |
| R-C3 | Experimental nodes: tool/function calling, vector-RAG lookup |
| R-C4 | Activity feed and run annotations |

#### Won't (MVP)

| ID | Requirement |
|----|-------------|
| R-W1 | Visual drag-and-drop DAG editor (JSON first) |
| R-W2 | Native mobile apps |
| R-W3 | On-prem/offline deployments |
| R-W4 | Formal compliance programs (SOC2/HIPAA); best-effort controls only initially |

---

## Method

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         OPERATOR                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js Console)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  App Router     │  │  API Routes     │  │  Server Actions │  │
│  │  (Pages)        │  │  (REST/tRPC)    │  │  (Mutations)    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  CASCADE Schema │  │  pg-boss        │  │  Realtime       │  │
│  │  (Prisma)       │  │  Job Tables     │  │  Subscriptions  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │  Storage        │  │  Connection     │                       │
│  │  (Artifacts)    │  │  Pooling        │                       │
│  └─────────────────┘  └─────────────────┘                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FLY.IO (Worker Service)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  pg-boss        │  │  LLM Executor   │  │  HTTP Executor  │  │
│  │  Runner         │  │  (OpenAI)       │  │  (Fetch)        │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
      ┌──────────┐        ┌──────────┐        ┌──────────┐
      │  OpenAI  │        │  Slack   │        │ External │
      │  API     │        │  API     │        │ HTTP     │
      └──────────┘        └──────────┘        └──────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Console** | Next.js 15 + Vercel | App Router, Server Components, zero-config deployment |
| **Database** | Supabase (Postgres) + Prisma | Managed Postgres with Realtime, Storage, connection pooling |
| **Queue** | pg-boss | Actively maintained, simple API, excellent TypeScript support |
| **Worker Host** | Fly.io | Easy horizontal scaling, good cold start, persistent processes |
| **Auth** | Resend + custom magic link | Simple, cheap ($0), full control over flow |
| **Expression Eval** | expr-eval | Safe sandboxed expressions, no arbitrary code execution |
| **Guardrails** | Pre-reserve tokens | Deduct max upfront, refund actual after step |
| **Monorepo** | pnpm + Turborepo | Fast, disk-efficient, excellent caching |
| **Styling** | Tailwind + shadcn/ui | Rapid UI, accessible components |
| **Realtime** | Supabase Realtime | Live run timeline updates without polling |
| **Artifact Storage** | Supabase Storage | Run artifacts, playbook exports |

### Supabase Features Utilized

| Feature | Usage in CASCADE |
|---------|------------------|
| **Postgres** | Primary database (same Prisma schema, full compatibility) |
| **Connection Pooling** | Supavisor for efficient connections from serverless |
| **Realtime** | Live subscriptions for run timeline updates |
| **Storage** | Run artifact storage, playbook exports |
| **Database Branching** | Preview environments for PRs |

### Connection Patterns

```bash
# Direct connection (migrations, scripts)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Pooled connection (app runtime - recommended)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct for pg-boss (needs direct connection for LISTEN/NOTIFY)
PGBOSS_DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

---

### Monorepo Structure

```
cascade/
├── apps/
│   ├── console/                 # Next.js 15 (Vercel)
│   │   ├── app/                 # App Router pages
│   │   │   ├── (auth)/          # Auth routes (magic link)
│   │   │   ├── (dashboard)/     # Protected routes
│   │   │   │   ├── workspaces/
│   │   │   │   ├── playbooks/
│   │   │   │   └── runs/
│   │   │   ├── api/             # API routes
│   │   │   └── layout.tsx
│   │   ├── components/          # UI components
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   ├── playbook/        # Playbook editor
│   │   │   └── run/             # Run timeline
│   │   ├── lib/                 # Console utilities
│   │   │   ├── auth.ts          # Magic link auth
│   │   │   ├── session.ts       # Session management
│   │   │   └── actions/         # Server actions
│   │   └── package.json
│   │
│   └── worker/                  # Node.js worker (Fly.io)
│       ├── src/
│       │   ├── executors/       # Step executors
│       │   │   ├── llm.ts       # OpenAI executor
│       │   │   ├── http.ts      # HTTP request executor
│       │   │   └── branch.ts    # Branch evaluator
│       │   ├── runner.ts        # Main job processor
│       │   ├── guardrails.ts    # Cost/token enforcement
│       │   └── index.ts         # Entry point
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── db/                      # Prisma schema + client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── index.ts         # Re-export PrismaClient
│   │   └── package.json
│   │
│   ├── runtime/                 # Workflow engine (shared)
│   │   ├── src/
│   │   │   ├── parser.ts        # Playbook validation
│   │   │   ├── executor.ts      # Step execution logic
│   │   │   ├── expression.ts    # Safe expr-eval wrapper
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── schemas/                 # Zod types (shared)
│   │   ├── src/
│   │   │   ├── playbook.ts      # PlaybookSchema, Node types
│   │   │   ├── run.ts           # Run, RunStep schemas
│   │   │   ├── workspace.ts     # Workspace schemas
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                  # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── turbo.json                   # Turborepo config
├── pnpm-workspace.yaml          # pnpm workspaces
├── package.json                 # Root package.json
├── .env.example                 # Environment template
└── README.md
```

---

### Data Model (Prisma Schema)

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTH & USERS
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  magicLinks    MagicLink[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiresAt])
}

model MagicLink {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
}

// ============================================
// WORKSPACES & PLAYBOOKS
// ============================================

model Workspace {
  id         String      @id @default(cuid())
  name       String
  slug       String      @unique
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  playbooks  Playbook[]
  runs       Run[]
  secrets    Secret[]
  guardrail  Guardrail?
  usageLogs  UsageLog[]
}

model Playbook {
  id          String            @id @default(cuid())
  workspaceId String
  name        String
  description String?
  currentId   String?           // Points to published version
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  workspace   Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  versions    PlaybookVersion[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

model PlaybookVersion {
  id         String   @id @default(cuid())
  playbookId String
  version    Int
  definition Json     // Validated against PlaybookSchema
  createdAt  DateTime @default(now())
  playbook   Playbook @relation(fields: [playbookId], references: [id], onDelete: Cascade)
  runs       Run[]

  @@unique([playbookId, version])
  @@index([playbookId])
}

// ============================================
// RUNS & STEPS
// ============================================

model Run {
  id              String          @id @default(cuid())
  workspaceId     String
  playbookVerId   String
  status          RunStatus       @default(PENDING)
  input           Json?
  output          Json?
  error           String?
  costCents       Int             @default(0)
  tokensIn        Int             @default(0)
  tokensOut       Int             @default(0)
  reservedTokens  Int             @default(0)  // Pre-reserved for guardrails
  startedAt       DateTime?
  finishedAt      DateTime?
  createdAt       DateTime        @default(now())
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  playbookVer     PlaybookVersion @relation(fields: [playbookVerId], references: [id])
  steps           RunStep[]

  @@index([workspaceId, status])
  @@index([playbookVerId])
  @@index([createdAt])
}

enum RunStatus {
  PENDING
  RUNNING
  SUCCEEDED
  FAILED
  CANCELED
}

model RunStep {
  id             String     @id @default(cuid())
  runId          String
  idx            Int        // Step number in timeline
  nodeId         String     // Reference to node in playbook definition
  kind           String     // llm | http | branch
  name           String
  input          Json?
  output         Json?
  status         StepStatus @default(PENDING)
  error          String?
  costCents      Int        @default(0)
  tokensIn       Int        @default(0)
  tokensOut      Int        @default(0)
  retryCount     Int        @default(0)
  idempotencyKey String     @unique
  startedAt      DateTime?
  finishedAt     DateTime?
  createdAt      DateTime   @default(now())
  run            Run        @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId, idx])
  @@index([idempotencyKey])
}

enum StepStatus {
  PENDING
  RUNNING
  SUCCEEDED
  FAILED
  SKIPPED
}

// ============================================
// GUARDRAILS & USAGE
// ============================================

model Guardrail {
  id                 String    @id @default(cuid())
  workspaceId        String    @unique
  dailyTokenCap      Int       @default(250000)
  dailyCostCapCents  Int       @default(1000)    // $10
  perRunTokenCap     Int       @default(200000)
  perRunCostCapCents Int       @default(500)     // $5
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  workspace          Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model UsageLog {
  id          String    @id @default(cuid())
  workspaceId String
  runId       String?
  stepId      String?
  tokensIn    Int       @default(0)
  tokensOut   Int       @default(0)
  costCents   Int       @default(0)
  timestamp   DateTime  @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, timestamp])
}

// ============================================
// SECRETS
// ============================================

model Secret {
  id          String    @id @default(cuid())
  workspaceId String
  key         String
  cipherText  Bytes     // AES-256-GCM encrypted
  iv          Bytes     // Initialization vector
  authTag     Bytes     // Authentication tag
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, key])
  @@index([workspaceId])
}

model SecretAuditLog {
  id          String   @id @default(cuid())
  workspaceId String
  secretKey   String
  action      String   // read | write | delete
  runId       String?
  timestamp   DateTime @default(now())

  @@index([workspaceId, timestamp])
}

// ============================================
// RATE LIMITING
// ============================================

model RateLimitEvent {
  id          String   @id @default(cuid())
  workspaceId String
  bucket      String   // "minute" | "hour" | "day"
  timestamp   DateTime @default(now())

  @@index([workspaceId, bucket, timestamp])
}
```

---

### Playbook Schema (Zod)

```typescript
// packages/schemas/src/playbook.ts

import { z } from "zod";

// ============================================
// NODE TYPES
// ============================================

export const LlmNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("llm"),
  name: z.string().min(1),
  model: z.string().default("gpt-4o"),
  system: z.string().optional(),
  prompt: z.string().min(1),
  maxOutputTokens: z.number().int().min(1).max(32768).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.any()),
  })).optional(),
  saveAs: z.string().optional(),
  next: z.string().optional(), // Next node ID
});

export const HttpNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("http"),
  name: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string(), // Template string with {{ctx.var}}
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().int().min(1000).max(30000).default(10000),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const BranchNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("branch"),
  name: z.string().min(1),
  expression: z.string().min(1), // expr-eval expression
  onTrue: z.string(),  // Next node ID if true
  onFalse: z.string(), // Next node ID if false
});

export const SlackNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("slack"),
  name: z.string().min(1),
  channel: z.string(), // Channel ID or template
  message: z.string(), // Template string
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const NodeSchema = z.discriminatedUnion("type", [
  LlmNodeSchema,
  HttpNodeSchema,
  BranchNodeSchema,
  SlackNodeSchema,
]);

// ============================================
// PLAYBOOK DEFINITION
// ============================================

export const PlaybookSchema = z.object({
  version: z.literal(1),
  entry: z.string().min(1), // Entry node ID
  nodes: z.array(NodeSchema).min(1),
}).refine(
  (data) => {
    const nodeIds = new Set(data.nodes.map(n => n.id));
    // Validate entry exists
    if (!nodeIds.has(data.entry)) return false;
    // Validate all next/onTrue/onFalse references
    for (const node of data.nodes) {
      if ('next' in node && node.next && !nodeIds.has(node.next)) return false;
      if ('onTrue' in node && !nodeIds.has(node.onTrue)) return false;
      if ('onFalse' in node && !nodeIds.has(node.onFalse)) return false;
    }
    return true;
  },
  { message: "Invalid node references in playbook" }
);

export type LlmNode = z.infer<typeof LlmNodeSchema>;
export type HttpNode = z.infer<typeof HttpNodeSchema>;
export type BranchNode = z.infer<typeof BranchNodeSchema>;
export type SlackNode = z.infer<typeof SlackNodeSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Playbook = z.infer<typeof PlaybookSchema>;
```

---

### Execution Engine Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        RUN EXECUTION FLOW                         │
└──────────────────────────────────────────────────────────────────┘

1. INITIATE RUN
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Console │───▶│ Create  │───▶│ Enqueue │
   │ Action  │    │ Run     │    │ Job     │
   └─────────┘    └─────────┘    └─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Pre-reserve     │
              │ tokens based on │
              │ max_output      │
              └─────────────────┘

2. WORKER PICKS UP JOB
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ pg-boss │───▶│ Runner  │───▶│ Load    │
   │ Fetch   │    │ Start   │    │ Playbook│
   └─────────┘    └─────────┘    └─────────┘

3. STEP EXECUTION LOOP
   ┌──────────────────────────────────────────────────────────────┐
   │  FOR EACH STEP:                                               │
   │                                                               │
   │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
   │  │ Check    │──▶│ Check    │──▶│ Execute  │──▶│ Persist  │  │
   │  │ Idempot. │   │ Guardrail│   │ Step     │   │ Result   │  │
   │  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
   │       │              │              │              │         │
   │       ▼              ▼              ▼              ▼         │
   │  Skip if done   Fail if cap   LLM/HTTP/Branch  Update usage │
   │                 exceeded                        & refund    │
   └──────────────────────────────────────────────────────────────┘

4. COMPLETION
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Mark    │───▶│ Refund  │───▶│ Alert   │
   │ Complete│    │ Reserved│    │ if Error│
   └─────────┘    └─────────┘    └─────────┘
```

---

### pg-boss Job Queue Integration

```typescript
// apps/worker/src/queue.ts

import PgBoss from 'pg-boss';

// Job types
export const JOB_TYPES = {
  EXECUTE_RUN: 'execute-run',
  CLEANUP_EXPIRED: 'cleanup-expired',
} as const;

// Job payload schemas
export interface ExecuteRunPayload {
  runId: string;
  workspaceId: string;
  playbookVersionId: string;
}

// Initialize pg-boss
export async function createBoss(): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: process.env.PGBOSS_DATABASE_URL,
    // Use separate schema to avoid conflicts with Prisma
    schema: 'pgboss',
    // Retry configuration
    retryLimit: 3,
    retryDelay: 5,
    retryBackoff: true,
    // Monitoring
    monitorStateIntervalSeconds: 30,
    // Archive completed jobs for debugging
    archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
  });

  boss.on('error', (error) => {
    console.error('pg-boss error:', error);
  });

  await boss.start();
  return boss;
}

// Enqueue a run execution job (called from Console)
export async function enqueueRun(
  boss: PgBoss,
  payload: ExecuteRunPayload
): Promise<string | null> {
  return boss.send(JOB_TYPES.EXECUTE_RUN, payload, {
    // Unique key prevents duplicate jobs for same run
    singletonKey: `run:${payload.runId}`,
    // Expire if not picked up within 5 minutes
    expireInSeconds: 300,
  });
}

// Worker handler registration
export async function registerHandlers(
  boss: PgBoss,
  handlers: {
    executeRun: (job: PgBoss.Job<ExecuteRunPayload>) => Promise<void>;
  }
): Promise<void> {
  await boss.work<ExecuteRunPayload>(
    JOB_TYPES.EXECUTE_RUN,
    {
      teamSize: parseInt(process.env.WORKER_CONCURRENCY || '5'),
      teamConcurrency: 1, // Each run processed by one worker
    },
    handlers.executeRun
  );
}
```

### Supabase Realtime Integration

```typescript
// apps/console/lib/realtime.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Subscribe to run step updates
export function subscribeToRunSteps(
  runId: string,
  onUpdate: (step: RunStep) => void
) {
  const channel = supabase
    .channel(`run:${runId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'RunStep',
        filter: `runId=eq.${runId}`,
      },
      (payload) => {
        onUpdate(payload.new as RunStep);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to run status changes
export function subscribeToRun(
  runId: string,
  onUpdate: (run: Run) => void
) {
  const channel = supabase
    .channel(`run-status:${runId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'Run',
        filter: `id=eq.${runId}`,
      },
      (payload) => {
        onUpdate(payload.new as Run);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

---

### Guardrail Enforcement (Pre-Reserve Strategy)

```typescript
// packages/runtime/src/guardrails.ts

interface GuardrailCheck {
  allowed: boolean;
  reason?: string;
  reservedTokens?: number;
}

export async function checkGuardrails(
  workspaceId: string,
  runId: string,
  estimatedTokens: number, // max_output_tokens from node
  prisma: PrismaClient
): Promise<GuardrailCheck> {
  const [guardrail, run, dailyUsage] = await Promise.all([
    prisma.guardrail.findUnique({ where: { workspaceId } }),
    prisma.run.findUnique({ where: { id: runId } }),
    prisma.usageLog.aggregate({
      where: {
        workspaceId,
        timestamp: { gte: startOfDay(new Date()) },
      },
      _sum: { tokensIn: true, tokensOut: true, costCents: true },
    }),
  ]);

  if (!guardrail) return { allowed: true };

  // Check per-run cap
  const runTotal = (run?.tokensIn ?? 0) + (run?.tokensOut ?? 0) + (run?.reservedTokens ?? 0);
  if (runTotal + estimatedTokens > guardrail.perRunTokenCap) {
    return {
      allowed: false,
      reason: `Per-run token cap exceeded (${runTotal + estimatedTokens} > ${guardrail.perRunTokenCap})`,
    };
  }

  // Check daily cap
  const dailyTotal = (dailyUsage._sum.tokensIn ?? 0) + (dailyUsage._sum.tokensOut ?? 0);
  if (dailyTotal + estimatedTokens > guardrail.dailyTokenCap) {
    return {
      allowed: false,
      reason: `Daily token cap exceeded (${dailyTotal + estimatedTokens} > ${guardrail.dailyTokenCap})`,
    };
  }

  // Reserve tokens
  await prisma.run.update({
    where: { id: runId },
    data: { reservedTokens: { increment: estimatedTokens } },
  });

  return { allowed: true, reservedTokens: estimatedTokens };
}

export async function finalizeStep(
  runId: string,
  reservedTokens: number,
  actualTokensIn: number,
  actualTokensOut: number,
  costCents: number,
  prisma: PrismaClient
): Promise<void> {
  const refund = reservedTokens - (actualTokensIn + actualTokensOut);

  await prisma.run.update({
    where: { id: runId },
    data: {
      reservedTokens: { decrement: reservedTokens },
      tokensIn: { increment: actualTokensIn },
      tokensOut: { increment: actualTokensOut },
      costCents: { increment: costCents },
    },
  });
}
```

---

## Milestones

### Phase 0: Foundation (Days 1-2)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P0.1 | Initialize monorepo with pnpm + Turborepo | Infrastructure |
| P0.2 | Set up shared TypeScript/ESLint configs | Infrastructure |
| P0.3 | Create Supabase project + configure connection strings | R-M1 |
| P0.4 | Set up Prisma schema + migrations | R-M1 |
| P0.5 | Implement seed script with test data | R-M1 |
| P0.6 | Configure Supabase Storage bucket for artifacts | R-M4 |

### Phase 1: Core Packages (Days 3-4)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P1.1 | Implement `@cascade/schemas` (Zod types) | R-M2 |
| P1.2 | Implement `@cascade/db` (Prisma client export) | R-M1 |
| P1.3 | Implement `@cascade/runtime` parser | R-M2 |
| P1.4 | Implement expr-eval wrapper for branches | R-M2 |
| P1.5 | Add unit tests for schemas + parser | Quality |

### Phase 2: Console App - Auth (Days 5-6)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P2.1 | Set up Next.js 15 app with App Router | R-M1 |
| P2.2 | Configure Tailwind + shadcn/ui | R-M1 |
| P2.3 | Implement magic link auth (Resend) | R-M7 |
| P2.4 | Add session management + middleware | R-M7 |
| P2.5 | Create auth pages (login, verify) | R-M7 |

### Phase 3: Console App - Core Pages (Days 7-10)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P3.1 | Workspaces list page + CRUD | R-M1 |
| P3.2 | Playbook list + create/edit pages | R-M2 |
| P3.3 | JSON editor with schema validation | R-M2 |
| P3.4 | Run timeline page (logs, steps) | R-M4 |
| P3.5 | Run artifact download | R-M4 |
| P3.6 | Live guardrail counters display | R-M5 |

### Phase 4: Worker Service (Days 11-14)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P4.1 | Set up pg-boss in worker app | R-M8 |
| P4.2 | Implement LLM executor (OpenAI) | R-M3 |
| P4.3 | Implement HTTP executor | R-M3 |
| P4.4 | Implement branch executor | R-M2 |
| P4.5 | Implement runner loop with retries | R-M8 |
| P4.6 | Add idempotency key handling | R-M8 |
| P4.7 | Implement guardrail checks | R-M5 |
| P4.8 | Integrate Supabase Realtime for step updates | R-M4 |

### Phase 5: Secrets & Observability (Days 15-17)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P5.1 | Implement AES-256-GCM encryption | R-M6 |
| P5.2 | Secrets CRUD in console | R-M6 |
| P5.3 | Secret audit logging | R-M6 |
| P5.4 | Slack connector (alerts) | R-M3, R-M9 |
| P5.5 | Health endpoint for worker | R-M9 |
| P5.6 | Structured logging setup | R-M9 |

### Phase 6: Polish & Deploy (Days 18-20)
| Task | Deliverable | Requirement |
|------|-------------|-------------|
| P6.1 | E2E testing (critical paths) | Quality |
| P6.2 | Deploy console to Vercel | R-M1 |
| P6.3 | Deploy worker to Fly.io | R-M1 |
| P6.4 | Set up environment secrets | R-M6 |
| P6.5 | Documentation (README, API) | Quality |
| P6.6 | Founder mode walkthrough | R-M1 |

---

## Gathering Results

### Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Core Functionality** | All R-M* requirements met | Manual QA checklist |
| **Run Completion Rate** | >95% for valid playbooks | Run status aggregation |
| **Step Latency (P95)** | ≤2s excluding LLM time | Worker metrics |
| **Guardrail Accuracy** | 100% enforcement (no cap breaches) | Usage log audit |
| **Auth Security** | No session leaks, valid CSRF | Security review |
| **Uptime** | >99% for console + worker | Health checks |

### Validation Tests

1. **Happy Path**: Create workspace → Create playbook → Run → View timeline → Download artifact
2. **Guardrail Trip**: Run playbook that exceeds token cap → Verify hard-stop + Slack alert
3. **Idempotency**: Kill worker mid-run → Restart → Verify no duplicate step execution
4. **Branch Logic**: Playbook with conditional paths → Verify correct branch taken
5. **Secret Usage**: Playbook referencing {{secrets.API_KEY}} → Verify decryption + audit log

### Monitoring

- **Console**: Vercel Analytics + Error tracking
- **Worker**: Fly.io metrics + custom health endpoint
- **Database**: Neon dashboard + query performance
- **Alerts**: Slack channel for failures + guardrail breaches

---

## Appendix

### Environment Variables

```bash
# .env.example

# Supabase
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Server-side only

# Database (Supabase Postgres)
# Pooled connection for app (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct connection for migrations & pg-boss (port 5432)
DIRECT_DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Auth
RESEND_API_KEY="re_..."
MAGIC_LINK_SECRET="..."  # 32-byte random hex
SESSION_SECRET="..."      # 32-byte random hex

# Encryption
ENCRYPTION_KEY="..."      # 32-byte hex for AES-256

# OpenAI
OPENAI_API_KEY="sk-..."

# Slack
SLACK_BOT_TOKEN="xoxb-..."
SLACK_ALERT_CHANNEL="#cascade-alerts"

# Worker
WORKER_CONCURRENCY=5
PGBOSS_DATABASE_URL="${DIRECT_DATABASE_URL}"  # pg-boss needs direct connection
```

### Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `run-artifacts` | Downloadable run outputs (JSON, logs) | Private, signed URLs |
| `playbook-exports` | Exported playbook definitions | Private, signed URLs |

### Cost Estimation (OpenAI GPT-4o)

| Model | Input ($/1M) | Output ($/1M) |
|-------|--------------|---------------|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4-turbo | $10.00 | $30.00 |

Default guardrails ($10/day) allow ~1M tokens/day with gpt-4o-mini or ~100K tokens/day with gpt-4o.
