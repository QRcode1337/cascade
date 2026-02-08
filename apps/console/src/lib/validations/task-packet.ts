/**
 * Zod validation schemas for TaskPacket data
 */

import { z } from 'zod';

export const TaskPacketSchema = z.object({
  client_or_prospect: z.object({
    name: z.string(),
    industry: z.string(),
    location: z.string(),
    website: z.string(),
    goal: z.string(),
  }),
  lane: z.enum(['lane1', 'lane2', 'lane3', 'unknown']),
  constraints: z.object({
    budget: z.string(),
    tools: z.string(),
    compliance: z.string(),
  }),
  artifacts: z.object({
    notes: z.string(),
    links: z.string(),
  }),
});
