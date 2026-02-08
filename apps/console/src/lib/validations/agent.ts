/**
 * Zod validation schemas for Agent data
 */

import { z } from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  mission: z.string(),
  systemPrompt: z.string().nullable(),
  playbooks: z.array(z.string()),
  outputs: z.array(z.string()),
  lane: z.string().nullable(),
});

export const AgentListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  mission: z.string(),
  playbooks: z.array(z.string()),
  outputs: z.array(z.string()),
  lane: z.string().nullable(),
});

export const AgentArraySchema = z.array(AgentSchema);
export const AgentListArraySchema = z.array(AgentListItemSchema);
