/**
 * Zod schemas and TypeScript types for CASCADE's Sublinear Security Intelligence nodes.
 *
 * Three new node types:
 *   - GraphNodeSchema     → "graph-analyze"
 *   - IntelligenceNodeSchema → "intelligence"
 *   - EmergenceNodeSchema    → "emergence-detect"
 */

import { z } from 'zod';

// ============================================
// GRAPH ANALYZE NODE
// ============================================

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('graph-analyze'),
  name: z.string().min(1),
  /**
   * Edge list: either a JSON array literal or a Mustache/Handlebars template
   * that resolves to `Array<{ source: number; target: number; weight?: number }>`.
   */
  edges: z.union([
    z.string().min(1),
    z.array(
      z.object({
        source: z.number().int().min(0),
        target: z.number().int().min(0),
        weight: z.number().positive().optional(),
      }),
    ),
  ]),
  /** Explicit node count; inferred from max edge index when omitted. */
  nodeCount: z.number().int().min(2).optional(),
  /** PageRank damping factor (default 0.85). */
  damping: z.number().min(0).max(1).default(0.85),
  /** Convergence epsilon (default 1e-6). */
  epsilon: z.number().positive().default(1e-6),
  /** Maximum PageRank iterations (default 1000). */
  maxIterations: z.number().int().min(1).default(1000),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

// ============================================
// INTELLIGENCE NODE
// ============================================

export const IntelligenceNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('intelligence'),
  name: z.string().min(1),
  /**
   * Reasoning query — supports Mustache/Handlebars template syntax
   * (e.g. `"Analyse threat {{ctx.threatName}} in context of {{ctx.domain}}"`)
   */
  query: z.string().min(1),
  /**
   * Keys from the execution context to forward as additional reasoning context.
   * Omit to pass no context keys.
   */
  contextKeys: z.array(z.string()).optional(),
  /** Reasoning depth; higher = more steps (default 7). */
  depth: z.number().int().min(1).max(20).default(7),
  /** Enable in-memory result caching (default true). */
  useCache: z.boolean().default(true),
  /**
   * Allow the knowledge base to learn from this interaction.
   * Disable in CI / stateless environments (default false).
   */
  enableLearning: z.boolean().default(false),
  /** Activate creative bridging for novel concepts (default true). */
  creativeMode: z.boolean().default(true),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

// ============================================
// EMERGENCE DETECT NODE
// ============================================

export const EmergenceNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('emergence-detect'),
  name: z.string().min(1),
  /**
   * Input for the emergence pipeline.  May be a raw value, a JSON string,
   * or a Mustache/Handlebars template resolving to any value.
   */
  input: z.union([z.string().min(1), z.unknown()]),
  /**
   * Novelty threshold above which a result is flagged `is_anomalous`
   * (default 0.7, range 0–1).
   */
  anomalyThreshold: z.number().min(0).max(1).default(0.7),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type IntelligenceNode = z.infer<typeof IntelligenceNodeSchema>;
export type EmergenceNode = z.infer<typeof EmergenceNodeSchema>;
