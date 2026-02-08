# CASCADE Design Enhancements

**Deep design analysis for user-friendly features and architectural improvements.**

---

## 1. UX/UI Enhancements

### 1.1 Dashboard & Navigation

#### Home Dashboard
```
┌─────────────────────────────────────────────────────────────────────┐
│  CASCADE                                    [Workspace: acme-prod ▼] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Active Runs │  │ Today's     │  │ Token       │  │ Success     │ │
│  │     3       │  │ Cost: $2.47 │  │ Budget: 67% │  │ Rate: 94%   │ │
│  │ ● ● ●       │  │ ↑12% vs avg │  │ ████████░░  │  │ ↑2% vs week │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                      │
│  RECENT RUNS                                              [View All] │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✅ customer-onboard    2m ago     $0.12    423 tokens        │   │
│  │ ⏳ daily-report        Running    $0.08    156 tokens  ●●●○○ │   │
│  │ ❌ slack-summary       5m ago     $0.04    Error: timeout    │   │
│  │ ✅ lead-enrichment     12m ago    $0.31    1,247 tokens      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  QUICK ACTIONS                                                       │
│  [+ New Playbook]  [▶ Run Playbook]  [📊 Usage Report]  [⚙ Settings]│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time active run counter with live updates
- Daily cost tracker with trend comparison
- Token budget progress bar (visual guardrail status)
- Success rate with historical comparison
- One-click quick actions
- Workspace switcher in header

#### Sidebar Navigation
```
┌──────────────────┐
│ 🏠 Dashboard     │
│ 📚 Playbooks     │
│ ▶️ Runs          │
│ 🔐 Secrets       │
│ 📊 Analytics     │
│ ⚙️ Settings      │
├──────────────────┤
│ WORKSPACES       │
│ • acme-prod    ● │  ← Active indicator
│ • acme-staging   │
│ + Add workspace  │
└──────────────────┘
```

---

### 1.2 Playbook Editor Enhancements

#### Monaco-Based JSON Editor
```typescript
// Enhanced playbook editor features
interface PlaybookEditorFeatures {
  // Core editing
  syntaxHighlighting: true;
  autoCompletion: {
    nodeTypes: ['llm', 'http', 'branch', 'slack'];
    contextVariables: true;      // {{ctx.}} autocomplete
    secretReferences: true;      // {{secrets.}} autocomplete
    modelSuggestions: true;      // gpt-4o, gpt-4o-mini, etc.
  };

  // Validation
  realTimeValidation: true;
  schemaValidation: true;
  referenceValidation: true;     // Check node ID references

  // Helpers
  snippets: {
    llmNode: 'Insert LLM Call node template';
    httpNode: 'Insert HTTP Request node template';
    branchNode: 'Insert Branch node template';
  };

  // Visual aids
  minimap: true;
  foldingRegions: true;
  bracketPairing: true;
}
```

#### Split-View Editor
```
┌─────────────────────────────────────────────────────────────────────┐
│ customer-onboard.json                    [Validate] [Test] [Publish]│
├─────────────────────────────┬───────────────────────────────────────┤
│ {                           │  FLOW PREVIEW                         │
│   "version": 1,             │  ┌─────────┐                          │
│   "entry": "start",         │  │ start   │ LLM: Extract intent      │
│   "nodes": [                │  └────┬────┘                          │
│     {                       │       │                               │
│       "id": "start",        │       ▼                               │
│       "type": "llm",        │  ┌─────────┐                          │
│       "name": "Extract...", │  │ check   │ Branch: has_email?       │
│       "model": "gpt-4o",    │  └────┬────┘                          │
│       "prompt": "...",      │    ┌──┴──┐                            │
│       "next": "check"       │    ▼     ▼                            │
│     },                      │  [enrich] [manual]                    │
│     ...                     │                                       │
│   ]                         │  ──────────────────────────────       │
│ }                           │  VALIDATION                           │
│                             │  ✅ Schema valid                      │
│                             │  ✅ All node refs valid               │
│                             │  ⚠️ Consider adding error handling    │
│                             │                                       │
│                             │  ESTIMATED COST                       │
│                             │  ~$0.08-0.15 per run                  │
└─────────────────────────────┴───────────────────────────────────────┘
```

**Features:**
- Live DAG visualization (read-only, from JSON)
- Real-time validation panel
- Cost estimation based on models + max tokens
- Test run button (dry-run with sample input)

---

### 1.3 Run Timeline Enhancements

#### Interactive Timeline View
```
┌─────────────────────────────────────────────────────────────────────┐
│ Run: run_abc123                                      [⬇ Download]   │
│ Status: ✅ Succeeded   Duration: 4.2s   Cost: $0.12   Tokens: 1,247│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TIMELINE                                                            │
│  ═══════════════════════════════════════════════════════════════    │
│  0s        1s        2s        3s        4s        4.2s             │
│  │─────────│─────────│─────────│─────────│─────────│                │
│  ├─[start]─────────────────────┤                                    │
│  │ LLM: gpt-4o  $0.08  890tok │                                     │
│  │                             ├─[check]──┤                         │
│  │                             │ Branch   │                         │
│  │                                        ├─[enrich]───────────┤    │
│  │                                        │ HTTP: api.clearbit │    │
│  │                                                             │    │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  STEP DETAILS                                    [start ▼]          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Node: start (LLM)                                              │  │
│  │ Model: gpt-4o   Tokens: 156 in / 734 out   Cost: $0.08        │  │
│  │ Duration: 2.3s  Status: ✅ Succeeded                           │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ INPUT                                                          │  │
│  │ {                                                              │  │
│  │   "customer_email": "jane@acme.com",                          │  │
│  │   "message": "I need help with billing..."                    │  │
│  │ }                                                              │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ OUTPUT                                                         │  │
│  │ {                                                              │  │
│  │   "intent": "billing_inquiry",                                │  │
│  │   "sentiment": "neutral",                                      │  │
│  │   "priority": "medium"                                         │  │
│  │ }                                                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Gantt-style timeline visualization
- Click-to-expand step details
- Input/output JSON viewers with syntax highlighting
- Copy buttons for all data
- Retry individual step (for debugging)
- "Re-run from here" option

---

### 1.4 Toast Notifications & Feedback

```typescript
// Notification types with appropriate styling
const notifications = {
  runStarted: {
    type: 'info',
    title: 'Run Started',
    message: 'customer-onboard is now running',
    action: { label: 'View', href: '/runs/abc123' },
    duration: 5000,
  },
  runCompleted: {
    type: 'success',
    title: 'Run Completed',
    message: 'customer-onboard finished in 4.2s',
    action: { label: 'View Results', href: '/runs/abc123' },
    duration: 8000,
  },
  runFailed: {
    type: 'error',
    title: 'Run Failed',
    message: 'customer-onboard failed at step "enrich"',
    action: { label: 'View Error', href: '/runs/abc123' },
    duration: 0, // Persist until dismissed
  },
  guardrailWarning: {
    type: 'warning',
    title: 'Approaching Token Limit',
    message: 'Daily usage at 85% of budget',
    action: { label: 'Adjust Limits', href: '/settings/guardrails' },
    duration: 10000,
  },
};
```

---

## 2. Developer Experience

### 2.1 Playbook Templates

```typescript
// Pre-built templates for common use cases
const playbookTemplates = [
  {
    id: 'customer-support-triage',
    name: 'Customer Support Triage',
    description: 'Classify and route incoming support requests',
    category: 'Support',
    nodes: ['llm-classify', 'branch-priority', 'slack-notify'],
    estimatedCost: '$0.02-0.05/run',
  },
  {
    id: 'lead-enrichment',
    name: 'Lead Enrichment',
    description: 'Enrich lead data from multiple sources',
    category: 'Sales',
    nodes: ['http-clearbit', 'http-linkedin', 'llm-summarize'],
    estimatedCost: '$0.10-0.20/run',
  },
  {
    id: 'content-generation',
    name: 'Content Generation',
    description: 'Generate blog posts from outlines',
    category: 'Marketing',
    nodes: ['llm-outline', 'llm-draft', 'llm-polish'],
    estimatedCost: '$0.30-0.50/run',
  },
  {
    id: 'daily-summary',
    name: 'Daily Summary Report',
    description: 'Aggregate data and send daily digest',
    category: 'Operations',
    nodes: ['http-fetch', 'llm-summarize', 'slack-post'],
    estimatedCost: '$0.05-0.10/run',
  },
];
```

### 2.2 Variable Explorer & Context Inspector

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTEXT EXPLORER                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Available at runtime in {{ctx.*}}                                    │
│                                                                      │
│ ▼ ctx                                                                │
│   ├─ input                 {object}   Original run input             │
│   │  ├─ customer_email    "jane@acme.com"                           │
│   │  └─ message           "I need help..."                          │
│   ├─ start                 {object}   Output from 'start' node       │
│   │  ├─ intent            "billing_inquiry"                         │
│   │  └─ sentiment         "neutral"                                  │
│   ├─ enrich               {object}   Output from 'enrich' node      │
│   │  └─ company           {object}                                   │
│   │     ├─ name           "Acme Corp"                               │
│   │     └─ employees      150                                        │
│   └─ _meta                {object}   Run metadata                    │
│      ├─ runId             "run_abc123"                               │
│      ├─ timestamp         "2025-01-15T10:30:00Z"                    │
│      └─ workspace         "acme-prod"                                │
│                                                                      │
│ ▼ secrets                                                            │
│   ├─ OPENAI_API_KEY       ••••••••••••                              │
│   ├─ CLEARBIT_KEY         ••••••••••••                              │
│   └─ SLACK_TOKEN          ••••••••••••                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Test Mode & Dry Runs

```typescript
// Test configuration
interface TestRunConfig {
  // Run modes
  mode: 'full' | 'dry-run' | 'single-step';

  // Mock external calls
  mockHttp: boolean;           // Use recorded/mocked HTTP responses
  mockLlm: boolean;            // Use cached LLM responses or stubs

  // Sample data
  sampleInput: Record<string, unknown>;

  // Step control
  breakpoints: string[];       // Node IDs to pause at
  skipNodes: string[];         // Nodes to skip

  // Cost control
  maxCost: number;            // Abort if exceeds
  maxTokens: number;          // Abort if exceeds
}
```

**Test Panel UI:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ TEST RUN                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Mode: [Full Run ▼]  [x] Mock HTTP  [ ] Mock LLM                      │
│                                                                      │
│ Sample Input:                                                        │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ {                                                              │   │
│ │   "customer_email": "test@example.com",                       │   │
│ │   "message": "Test message for dry run"                       │   │
│ │ }                                                              │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ [Load from previous run ▼]  [Use template ▼]                        │
│                                                                      │
│ Estimated: ~$0.08  ~450 tokens  ~3s                                 │
│                                                                      │
│                                    [Cancel]  [▶ Run Test]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Prompt Playground (Inline LLM Testing)

```
┌─────────────────────────────────────────────────────────────────────┐
│ PROMPT PLAYGROUND                               Node: start (LLM)   │
├─────────────────────────────────────────────────────────────────────┤
│ Model: [gpt-4o ▼]  Temp: [0.7]  Max Tokens: [4096]                  │
│                                                                      │
│ SYSTEM PROMPT                                                        │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ You are a customer support triage assistant. Analyze the      │   │
│ │ incoming message and extract intent, sentiment, and priority. │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ USER PROMPT (with variables)                                         │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Customer email: {{ctx.input.customer_email}}                  │   │
│ │ Message: {{ctx.input.message}}                                │   │
│ │                                                                │   │
│ │ Respond in JSON format with keys: intent, sentiment, priority │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ TEST VARIABLES                                                       │
│ ctx.input.customer_email: [test@example.com                    ]    │
│ ctx.input.message:        [I need help with my bill             ]   │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────   │
│ RESPONSE                                          Cost: $0.02       │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ {                                                              │   │
│ │   "intent": "billing_inquiry",                                │   │
│ │   "sentiment": "neutral",                                      │   │
│ │   "priority": "medium"                                         │   │
│ │ }                                                              │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ [Copy Response]  [Save as Test Case]       [▶ Test Prompt]          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Operational Features

### 3.1 Usage Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ ANALYTICS                                    [Last 7 days ▼]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  COST BREAKDOWN                    TOKEN USAGE                       │
│  ┌─────────────────────┐          ┌─────────────────────┐           │
│  │ ████████████████    │          │ Input:  45,230      │           │
│  │ gpt-4o      $12.34  │          │ Output: 128,450     │           │
│  │ ████████            │          │ Total:  173,680     │           │
│  │ gpt-4o-mini  $3.21  │          │                     │           │
│  │ ████                │          │ [===========----]   │           │
│  │ HTTP calls   $0.00  │          │ 69% of daily cap    │           │
│  └─────────────────────┘          └─────────────────────┘           │
│                                                                      │
│  RUNS BY STATUS                    RUNS OVER TIME                   │
│  ┌─────────────────────┐          ┌─────────────────────┐           │
│  │ ✅ Succeeded   847  │          │      _____          │           │
│  │ ❌ Failed       23  │          │     /     \  ___    │           │
│  │ ⏹ Canceled      5  │          │ ___/       \/   \   │           │
│  │                     │          │ M  T  W  T  F  S  S │           │
│  │ Success: 97.3%      │          └─────────────────────┘           │
│  └─────────────────────┘                                            │
│                                                                      │
│  TOP PLAYBOOKS BY COST            TOP ERRORS                        │
│  ┌─────────────────────┐          ┌─────────────────────┐           │
│  │ 1. lead-enrichment  │          │ Timeout (HTTP)   12 │           │
│  │    $8.45 (342 runs) │          │ Rate limit        8 │           │
│  │ 2. content-gen      │          │ Invalid JSON      3 │           │
│  │    $4.20 (28 runs)  │          │                     │           │
│  │ 3. daily-summary    │          │                     │           │
│  │    $2.10 (210 runs) │          │                     │           │
│  └─────────────────────┘          └─────────────────────┘           │
│                                                                      │
│  [📥 Export CSV]  [📊 Download Report]                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Enhanced Guardrail Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│ GUARDRAILS                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  DAILY LIMITS                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Token Cap          [250,000    ] tokens/day                    │  │
│  │ Cost Cap           [$10.00     ] /day                          │  │
│  │                                                                │  │
│  │ Current Usage:     173,680 tokens   $6.42                     │  │
│  │                    [███████████████░░░░] 69%                   │  │
│  │                                                                │  │
│  │ ⚠️ At current rate, you'll hit daily cap in ~3.2 hours         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PER-RUN LIMITS                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Max Tokens         [200,000    ] tokens/run                    │  │
│  │ Max Cost           [$5.00      ] /run                          │  │
│  │ Max Duration       [5          ] minutes                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ALERTS                                                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [x] Slack alert when daily usage > [80   ]%                   │  │
│  │ [x] Slack alert on any run failure                            │  │
│  │ [x] Email digest at end of day                                │  │
│  │ [ ] Pause all runs when daily cap reached                     │  │
│  │                                                                │  │
│  │ Alert Channel: [#cascade-alerts ▼]                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                                               [Save Changes]         │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Run Scheduling & Triggers

```typescript
// Trigger configuration
interface PlaybookTrigger {
  id: string;
  playbookId: string;
  type: 'manual' | 'webhook' | 'schedule' | 'event';

  // Webhook config
  webhook?: {
    path: string;                    // /api/webhooks/:path
    secret: string;                  // HMAC validation
    inputMapping?: Record<string, string>;  // Map webhook payload to run input
  };

  // Schedule config (cron)
  schedule?: {
    cron: string;                    // '0 9 * * 1-5' (9am weekdays)
    timezone: string;                // 'America/New_York'
    input?: Record<string, unknown>; // Static input for scheduled runs
  };

  // Event trigger (future)
  event?: {
    source: 'slack' | 'github' | 'stripe';
    eventType: string;
    filter?: Record<string, unknown>;
  };

  enabled: boolean;
  lastTriggered?: Date;
  nextTrigger?: Date;
}
```

**Trigger Management UI:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ TRIGGERS - daily-summary                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 🔗 Webhook                                            [Enabled] │ │
│  │ URL: https://cascade.app/api/webhooks/abc123                   │ │
│  │ Secret: ••••••••••••  [Copy] [Regenerate]                      │ │
│  │ Last triggered: Never                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ⏰ Schedule                                           [Enabled] │ │
│  │ Cron: 0 9 * * 1-5  (Every weekday at 9:00 AM)                  │ │
│  │ Timezone: America/New_York                                      │ │
│  │ Next run: Tomorrow at 9:00 AM                                   │ │
│  │ [Edit Schedule]                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [+ Add Trigger]                                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Architecture Refinements

### 4.1 Enhanced Data Model Additions

```prisma
// Additional models for enhancements

// Playbook templates (Could: R-C1)
model PlaybookTemplate {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String   // 'Support', 'Sales', 'Marketing', etc.
  definition  Json
  isPublic    Boolean  @default(false)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([category])
}

// Triggers (Should: R-S3)
model Trigger {
  id          String      @id @default(cuid())
  playbookId  String
  type        TriggerType
  config      Json        // Webhook path, cron expression, etc.
  enabled     Boolean     @default(true)
  lastFired   DateTime?
  nextFire    DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  playbook    Playbook    @relation(fields: [playbookId], references: [id], onDelete: Cascade)

  @@index([playbookId])
  @@index([type, enabled])
}

enum TriggerType {
  MANUAL
  WEBHOOK
  SCHEDULE
  EVENT
}

// Run annotations (Could: R-C4)
model RunAnnotation {
  id        String   @id @default(cuid())
  runId     String
  userId    String?
  type      String   // 'note', 'flag', 'tag'
  content   String
  createdAt DateTime @default(now())
  run       Run      @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId])
}

// Activity feed (Could: R-C4)
model Activity {
  id          String   @id @default(cuid())
  workspaceId String
  type        String   // 'run.started', 'playbook.published', 'guardrail.triggered'
  entityType  String   // 'run', 'playbook', 'secret'
  entityId    String
  metadata    Json?
  timestamp   DateTime @default(now())

  @@index([workspaceId, timestamp])
  @@index([entityType, entityId])
}

// Extend Run model
model Run {
  // ... existing fields ...

  // New fields for enhancements
  triggerId     String?       // Which trigger started this run
  parentRunId   String?       // For sub-runs / child workflows
  tags          String[]      // User-defined tags
  priority      Int           @default(0)  // For queue ordering
  annotations   RunAnnotation[]

  trigger       Trigger?      @relation(fields: [triggerId], references: [id])
  parentRun     Run?          @relation("RunHierarchy", fields: [parentRunId], references: [id])
  childRuns     Run[]         @relation("RunHierarchy")
}

// Extend Workspace for analytics
model Workspace {
  // ... existing fields ...

  // Analytics cache
  dailyStats    Json?         // Cached daily aggregates
  statsUpdatedAt DateTime?

  triggers      Trigger[]
  activities    Activity[]
}
```

### 4.2 New Node Types

```typescript
// Enhanced node types

// Wait/Delay node
export const WaitNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('wait'),
  name: z.string().min(1),
  duration: z.number().int().min(1000).max(300000), // 1s to 5min
  next: z.string().optional(),
});

// Parallel execution node
export const ParallelNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('parallel'),
  name: z.string().min(1),
  branches: z.array(z.string()).min(2), // Node IDs to run in parallel
  joinStrategy: z.enum(['all', 'any', 'race']).default('all'),
  next: z.string().optional(),
});

// Loop/iteration node
export const LoopNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('loop'),
  name: z.string().min(1),
  items: z.string(), // Expression to get array: 'ctx.input.emails'
  itemVar: z.string().default('item'), // Variable name for current item
  body: z.string(), // Node ID to execute for each item
  maxIterations: z.number().int().min(1).max(100).default(10),
  next: z.string().optional(),
});

// Transform/map node (lightweight data transformation)
export const TransformNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('transform'),
  name: z.string().min(1),
  expression: z.string(), // JS expression or JSONPath
  saveAs: z.string(),
  next: z.string().optional(),
});

// Sub-playbook call
export const SubPlaybookNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('subplaybook'),
  name: z.string().min(1),
  playbookId: z.string(),
  input: z.record(z.string()), // Map current ctx to subplaybook input
  saveAs: z.string().optional(),
  next: z.string().optional(),
});
```

### 4.3 Caching Layer

```typescript
// Redis-compatible caching for expensive operations
interface CacheConfig {
  // LLM response caching (for identical prompts)
  llmCache: {
    enabled: boolean;
    ttl: number;           // Default 1 hour
    keyStrategy: 'hash-all' | 'hash-prompt-only';
  };

  // HTTP response caching
  httpCache: {
    enabled: boolean;
    ttl: number;
    cacheableStatuses: number[];  // [200, 201]
  };

  // Session/context caching
  contextCache: {
    enabled: boolean;
    ttl: number;           // For multi-step debugging
  };
}

// Using Supabase + Upstash Redis
// Or just Postgres with UNLOGGED tables for speed
```

### 4.4 Webhook Security

```typescript
// Enhanced webhook handling
interface WebhookSecurity {
  // HMAC signature validation
  signatureHeader: 'x-cascade-signature';
  algorithm: 'sha256';

  // Replay protection
  timestampHeader: 'x-cascade-timestamp';
  maxAge: 300; // 5 minutes

  // Rate limiting per webhook
  rateLimit: {
    requests: 100;
    window: 60; // seconds
  };

  // IP allowlist (optional)
  allowedIps?: string[];
}
```

---

## 5. Quality of Life Features

### 5.1 Keyboard Shortcuts

```typescript
const keyboardShortcuts = {
  global: {
    'cmd+k': 'Open command palette',
    'cmd+/': 'Toggle help',
    'cmd+,': 'Open settings',
  },
  playbooks: {
    'cmd+s': 'Save playbook',
    'cmd+enter': 'Run playbook',
    'cmd+shift+t': 'Test playbook',
    'cmd+shift+p': 'Publish playbook',
  },
  runs: {
    'j/k': 'Navigate steps',
    'enter': 'Expand step details',
    'r': 'Re-run',
    'd': 'Download artifact',
  },
  editor: {
    'cmd+shift+f': 'Format JSON',
    'cmd+d': 'Duplicate node',
    'cmd+shift+v': 'Validate',
  },
};
```

### 5.2 Command Palette

```
┌─────────────────────────────────────────────────────────────────────┐
│ >                                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ RECENT                                                               │
│   📚 customer-onboard                               Open playbook   │
│   ▶️  run_abc123                                    View run        │
│                                                                      │
│ ACTIONS                                                              │
│   ➕ Create new playbook                            cmd+n           │
│   ▶️  Run playbook...                               cmd+enter       │
│   🔍 Search runs...                                 cmd+shift+r     │
│   ⚙️  Settings                                      cmd+,           │
│                                                                      │
│ NAVIGATION                                                           │
│   🏠 Go to Dashboard                                                │
│   📚 Go to Playbooks                                                │
│   ▶️  Go to Runs                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Onboarding Flow

```
STEP 1: Welcome
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                        Welcome to CASCADE                            │
│                                                                      │
│     Your AI workflow automation platform is ready to go.            │
│                                                                      │
│     Let's set up your first workspace and playbook.                 │
│                                                                      │
│                         [Get Started →]                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

STEP 2: Create Workspace
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Create Your First Workspace                                         │
│                                                                      │
│  Workspace Name: [My Company                              ]         │
│                                                                      │
│  A workspace contains your playbooks, runs, and settings.           │
│                                                                      │
│                              [← Back]  [Create Workspace →]          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

STEP 3: Add OpenAI Key
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Connect OpenAI                                                      │
│                                                                      │
│  API Key: [sk-...                                         ]         │
│                                                                      │
│  Your API key is encrypted and stored securely.                     │
│  [How to get an API key?]                                           │
│                                                                      │
│                              [← Back]  [Connect →]                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

STEP 4: Choose Template
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Start with a Template                                               │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Customer Support │  │ Lead Enrichment  │  │ Content Gen      │  │
│  │ Triage           │  │                  │  │                  │  │
│  │                  │  │                  │  │                  │  │
│  │ Classify and     │  │ Enrich leads     │  │ Generate blog    │  │
│  │ route requests   │  │ from APIs        │  │ posts            │  │
│  │                  │  │                  │  │                  │  │
│  │ [Select]         │  │ [Select]         │  │ [Select]         │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│                    [Skip - Start from scratch]                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

STEP 5: Success!
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          ✅ You're all set!                          │
│                                                                      │
│     Your workspace "My Company" is ready with your first            │
│     playbook loaded.                                                 │
│                                                                      │
│     What's next?                                                     │
│     • Edit your playbook to customize it                            │
│     • Run a test to see it in action                                │
│     • Explore the dashboard                                          │
│                                                                      │
│                       [Go to Dashboard →]                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Error Recovery & Help

```typescript
// Smart error messages with recovery suggestions
const errorHandlers = {
  'OPENAI_RATE_LIMIT': {
    title: 'OpenAI Rate Limit Reached',
    message: 'Too many requests to OpenAI API',
    suggestions: [
      'Wait a few seconds and retry',
      'Consider using gpt-4o-mini for lower rate limits',
      'Check your OpenAI usage dashboard',
    ],
    action: { label: 'Retry', handler: 'retry' },
  },
  'GUARDRAIL_EXCEEDED': {
    title: 'Budget Limit Reached',
    message: 'This run would exceed your daily token/cost limit',
    suggestions: [
      'Increase your daily limit in Settings',
      'Wait until tomorrow when limits reset',
      'Use a smaller model to reduce token usage',
    ],
    action: { label: 'Adjust Limits', href: '/settings/guardrails' },
  },
  'INVALID_PLAYBOOK': {
    title: 'Playbook Validation Failed',
    message: 'Your playbook has configuration errors',
    suggestions: [
      'Check node ID references are valid',
      'Ensure all required fields are filled',
      'Validate JSON syntax',
    ],
    action: { label: 'View Errors', handler: 'showValidation' },
  },
};
```

---

## 6. Implementation Priority Matrix

### Phase 1 (MVP) - Must Have
| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Monaco JSON Editor | Medium | High | P0 |
| Real-time run timeline | Medium | High | P0 |
| Toast notifications | Low | High | P0 |
| Basic dashboard | Medium | High | P0 |
| Validation panel | Low | High | P0 |

### Phase 2 (Polish) - Should Have
| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| DAG flow preview | High | Medium | P1 |
| Test mode / dry runs | Medium | High | P1 |
| Usage analytics | Medium | High | P1 |
| Keyboard shortcuts | Low | Medium | P1 |
| Command palette | Medium | Medium | P1 |

### Phase 3 (Delight) - Could Have
| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Playbook templates | Medium | High | P2 |
| Prompt playground | High | Medium | P2 |
| Onboarding flow | Medium | High | P2 |
| Variable explorer | Medium | Medium | P2 |
| Run annotations | Low | Low | P2 |

### Phase 4 (Scale) - Nice to Have
| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Parallel nodes | High | Medium | P3 |
| Loop nodes | High | Medium | P3 |
| Sub-playbook calls | High | Medium | P3 |
| LLM response caching | Medium | Medium | P3 |
| Activity feed | Medium | Low | P3 |

---

## 7. Component Library (shadcn/ui Extensions)

### Custom Components to Build

```typescript
// Components specific to CASCADE
const cascadeComponents = [
  'RunStatusBadge',        // Status with icon + color
  'TokenCounter',          // Animated token usage display
  'CostDisplay',           // Formatted cost with currency
  'PlaybookCard',          // Playbook list item
  'RunCard',               // Run list item with live status
  'StepTimeline',          // Vertical timeline of steps
  'JsonViewer',            // Syntax-highlighted JSON
  'JsonEditor',            // Monaco-based editor
  'FlowPreview',           // DAG visualization
  'GuardrailMeter',        // Progress bar with thresholds
  'SecretInput',           // Masked input with reveal
  'CronBuilder',           // Visual cron expression builder
  'VariableAutocomplete',  // Context-aware {{}} autocomplete
];
```

---

## Summary

This design document outlines **50+ enhancements** across 6 categories:

1. **UX/UI** - Dashboard, editor, timeline, notifications
2. **Developer Experience** - Templates, testing, playground
3. **Operational** - Analytics, guardrails, triggers
4. **Architecture** - New models, node types, caching
5. **Quality of Life** - Shortcuts, command palette, onboarding
6. **Components** - Custom UI components

**Recommended build order:**
1. MVP with essential UX (Monaco editor, timeline, notifications)
2. Polish with testing and analytics
3. Delight with templates and onboarding
4. Scale with advanced node types

Ready to proceed to `/build` when you are!
