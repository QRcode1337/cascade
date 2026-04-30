/**
 * Intelligence executor — psycho-symbolic reasoning via sublinear-time-solver.
 * Resolves the query template against execution context and invokes
 * DynamicPsychoSymbolicTools.handleToolCall('psycho_symbolic_reason', ...).
 */

import { renderTemplate, type ExecutionContext } from '@cascade/runtime';
import type { IntelligenceNode } from '@cascade/schemas';

// Lazy-load sublinear to allow graceful degradation if the package is absent
let DynamicPsychoSymbolicTools: (new () => import('sublinear-time-solver/tools').DynamicPsychoSymbolicTools) | null =
  null;
try {
  const mod = await import('sublinear-time-solver/tools');
  DynamicPsychoSymbolicTools = mod.DynamicPsychoSymbolicTools;
} catch {
  // Package not yet installed — executor will throw a descriptive error at call-time
}

// Singleton instance — avoid constructing on every call (knowledge base is stateful)
let _toolsInstance: import('sublinear-time-solver/tools').DynamicPsychoSymbolicTools | null = null;
function getToolsInstance() {
  if (!DynamicPsychoSymbolicTools) {
    throw new Error(
      'sublinear-time-solver is not installed. Run `pnpm install` in apps/worker.',
    );
  }
  if (!_toolsInstance) {
    _toolsInstance = new DynamicPsychoSymbolicTools();
  }
  return _toolsInstance;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IntelligenceResult {
  /** Synthesized answer / reasoning text */
  reasoning: string;
  /** 0–1 confidence score from the reasoning engine */
  confidence: number;
  /** Detected knowledge domains (e.g. ["computer_science", "physics"]) */
  domains: string[];
  /** Knowledge triples examined during traversal */
  triples: number;
  /** Count of analogies explored */
  analogies: number;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

/**
 * Execute an `intelligence` node.
 *
 * Renders `node.query` as a Mustache/Handlebars template against `ctx`,
 * then passes it to `psycho_symbolic_reason` for multi-step symbolic
 * reasoning.  Returns a structured result normalised from the raw tool output.
 */
export async function executeIntelligenceNode(
  node: IntelligenceNode,
  ctx: ExecutionContext,
): Promise<IntelligenceResult> {
  const tools = getToolsInstance();

  const query = renderTemplate(node.query, ctx);

  // Build optional context map from node config
  const context: Record<string, unknown> =
    node.contextKeys && Array.isArray(node.contextKeys)
      ? Object.fromEntries(
          node.contextKeys.map((k) => [k, (ctx as Record<string, unknown>)[k]]),
        )
      : {};

  const raw = await tools.handleToolCall('psycho_symbolic_reason', {
    query,
    context,
    depth: node.depth ?? 7,
    use_cache: node.useCache ?? true,
    enable_learning: node.enableLearning ?? false, // default off in CI/prod
    creative_mode: node.creativeMode ?? true,
    domain_adaptation: true,
    analogical_reasoning: true,
  });

  return {
    reasoning: String(raw?.answer ?? raw?.insights?.join('\n') ?? ''),
    confidence: Number(raw?.confidence ?? 0),
    domains: Array.isArray(raw?.detected_domains) ? raw.detected_domains : [],
    triples: Number(raw?.triples_examined ?? 0),
    analogies: Number(raw?.analogies_explored ?? 0),
  };
}
