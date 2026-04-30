/**
 * Emergence executor — novel-pattern detection via sublinear-time-solver EmergenceSystem.
 * Processes arbitrary input through the multi-phase emergence pipeline and surfaces
 * novelty score, detected patterns, and complexity metrics.
 */

import { renderTemplate, type ExecutionContext } from '@cascade/runtime';
import type { EmergenceNode } from '@cascade/schemas';

// Lazy-load sublinear to allow graceful degradation if the package is absent
let EmergenceSystem: (new () => import('sublinear-time-solver').EmergenceSystem) | null = null;
try {
  const mod = await import('sublinear-time-solver');
  EmergenceSystem = (mod as unknown as { EmergenceSystem: new () => import('sublinear-time-solver').EmergenceSystem }).EmergenceSystem ?? null;
} catch {
  // Package not yet installed — executor will throw a descriptive error at call-time
}

// Singleton — EmergenceSystem carries persistent-learning state
let _emergenceInstance: InstanceType<NonNullable<typeof EmergenceSystem>> | null = null;
function getEmergenceInstance() {
  if (!EmergenceSystem) {
    throw new Error(
      'sublinear-time-solver is not installed. Run `pnpm install` in apps/worker.',
    );
  }
  if (!_emergenceInstance) {
    _emergenceInstance = new EmergenceSystem();
  }
  return _emergenceInstance;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface EmergenceResult {
  /** 0–1 score indicating how novel the input patterns are */
  novelty_score: number;
  /** Detected emergent pattern descriptors */
  patterns: string[];
  /** Overall system complexity estimate */
  complexity: number;
  /** True when novelty_score exceeds the anomaly threshold (default 0.7) */
  is_anomalous: boolean;
  /** Steps taken during stochastic exploration */
  exploration_path: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a clean summary list of patterns from the raw emergence session */
function extractPatterns(session: Record<string, unknown>): string[] {
  const results = session?.results as Record<string, unknown> | undefined;
  if (!results) return [];

  const patterns: string[] = [];

  // Capability detection produces an array of capability names
  const caps = (results.capabilities as Array<{ name?: string }> | undefined) ?? [];
  for (const cap of caps) {
    if (cap?.name) patterns.push(cap.name);
  }

  // Exploration summary may contain pattern hints
  const exploration = results.exploration as Record<string, unknown> | undefined;
  if (typeof exploration?.outputSummary === 'string') {
    patterns.push(exploration.outputSummary.slice(0, 120));
  }

  return patterns;
}

/** Extract exploration path step labels */
function extractPath(session: Record<string, unknown>): string[] {
  const results = session?.results as Record<string, unknown> | undefined;
  if (!results) return [];

  return Object.keys(results);
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

/**
 * Execute an `emergence-detect` node.
 *
 * Resolves `node.input` (template string or raw value) against `ctx` and
 * processes it through the EmergenceSystem pipeline.  Distills the full
 * emergence session into a compact result shape.
 */
export async function executeEmergenceNode(
  node: EmergenceNode,
  ctx: ExecutionContext,
): Promise<EmergenceResult> {
  const system = getEmergenceInstance();

  // Resolve input — may be a Mustache template or a raw value
  const rawInput: unknown =
    typeof node.input === 'string'
      ? (() => {
          const rendered = renderTemplate(node.input, ctx);
          try {
            return JSON.parse(rendered);
          } catch {
            return rendered;
          }
        })()
      : node.input;

  const session = await system.processWithEmergence(rawInput, []);

  const metrics = (session?.metrics ?? {}) as Record<string, number>;
  const emergenceSession = (session?.emergenceSession ??
    session ??
    {}) as Record<string, unknown>;

  const novelty_score = Number(
    metrics.explorationNovelty ??
      (emergenceSession?.results as Record<string, unknown> | undefined)
        ?.exploration?.novelty ??
      0,
  );

  const anomalyThreshold = node.anomalyThreshold ?? 0.7;

  return {
    novelty_score,
    patterns: extractPatterns(emergenceSession),
    complexity: Number(metrics.systemComplexity ?? metrics.overallEmergenceScore ?? 0),
    is_anomalous: novelty_score >= anomalyThreshold,
    exploration_path: extractPath(emergenceSession),
  };
}
