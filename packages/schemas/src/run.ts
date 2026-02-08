import { z } from 'zod';

// ============================================
// RUN STATUS
// ============================================

export const RunStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
]);

export const StepStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'SKIPPED',
]);

// ============================================
// RUN SCHEMAS
// ============================================

export const StartRunSchema = z.object({
  playbookId: z.string().min(1),
  input: z.record(z.unknown()).optional(),
  priority: z.number().int().min(0).max(10).default(0),
  tags: z.array(z.string()).optional(),
});

export const RunFilterSchema = z.object({
  workspaceId: z.string().min(1),
  status: RunStatusSchema.optional(),
  playbookId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================
// RUN STEP SCHEMAS
// ============================================

export const RunStepSchema = z.object({
  id: z.string(),
  runId: z.string(),
  idx: z.number().int(),
  nodeId: z.string(),
  kind: z.string(),
  name: z.string(),
  input: z.unknown().nullable(),
  output: z.unknown().nullable(),
  status: StepStatusSchema,
  error: z.string().nullable(),
  costCents: z.number().int(),
  tokensIn: z.number().int(),
  tokensOut: z.number().int(),
  retryCount: z.number().int(),
  startedAt: z.coerce.date().nullable(),
  finishedAt: z.coerce.date().nullable(),
});

export const RunSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  playbookVerId: z.string(),
  status: RunStatusSchema,
  input: z.unknown().nullable(),
  output: z.unknown().nullable(),
  error: z.string().nullable(),
  costCents: z.number().int(),
  tokensIn: z.number().int(),
  tokensOut: z.number().int(),
  reservedTokens: z.number().int(),
  startedAt: z.coerce.date().nullable(),
  finishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  steps: z.array(RunStepSchema).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RunStatus = z.infer<typeof RunStatusSchema>;
export type StepStatus = z.infer<typeof StepStatusSchema>;
export type StartRun = z.infer<typeof StartRunSchema>;
export type RunFilter = z.infer<typeof RunFilterSchema>;
export type RunStep = z.infer<typeof RunStepSchema>;
export type Run = z.infer<typeof RunSchema>;
