import { z } from 'zod';

// ============================================
// WORKSPACE SCHEMAS
// ============================================

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================
// GUARDRAIL SCHEMAS
// ============================================

export const GuardrailSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  dailyTokenCap: z.number().int().min(0),
  dailyCostCapCents: z.number().int().min(0),
  perRunTokenCap: z.number().int().min(0),
  perRunCostCapCents: z.number().int().min(0),
});

export const UpdateGuardrailSchema = z.object({
  dailyTokenCap: z.number().int().min(0).optional(),
  dailyCostCapCents: z.number().int().min(0).optional(),
  perRunTokenCap: z.number().int().min(0).optional(),
  perRunCostCapCents: z.number().int().min(0).optional(),
});

// ============================================
// SECRET SCHEMAS
// ============================================

export const CreateSecretSchema = z.object({
  workspaceId: z.string().min(1),
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be uppercase with underscores'),
  value: z.string().min(1),
});

export const SecretSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  key: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspace = z.infer<typeof UpdateWorkspaceSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type Guardrail = z.infer<typeof GuardrailSchema>;
export type UpdateGuardrail = z.infer<typeof UpdateGuardrailSchema>;
export type CreateSecret = z.infer<typeof CreateSecretSchema>;
export type Secret = z.infer<typeof SecretSchema>;
