/**
 * Graph analysis executor — PageRank-based anomaly detection via sublinear-time-solver.
 * Wraps GraphTools.pageRank and enriches results with anomaly flagging.
 */

import { renderTemplate, type ExecutionContext } from '@cascade/runtime';
import type { GraphNode } from '@cascade/schemas';

// Lazy-load sublinear to allow graceful degradation if the package is absent
let GraphTools: typeof import('sublinear-time-solver/tools').GraphTools | null = null;
try {
  const mod = await import('sublinear-time-solver/tools');
  GraphTools = mod.GraphTools;
} catch {
  // Package not yet installed — executor will throw a descriptive error at call-time
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GraphEdge {
  source: number;
  target: number;
  weight?: number;
}

export interface GraphResult {
  /** Raw PageRank score for every node (index-aligned) */
  scores: number[];
  /** Top-10 nodes sorted by descending score */
  topNodes: Array<{ node: number; score: number }>;
  /** Nodes whose score exceeds mean + 2×stddev */
  anomalies: Array<{ node: number; score: number; zScore: number }>;
  statistics: {
    mean: number;
    standardDeviation: number;
    maxScore: number;
    minScore: number;
    entropy: number;
    totalScore: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a dense adjacency Matrix from a flat edge list.
 * Node indices are zero-based; dimension equals max(node-index) + 1.
 */
function buildAdjacencyMatrix(
  edges: GraphEdge[],
  nodeCount?: number,
): { rows: number; cols: number; data: number[][]; format: 'dense' } {
  const n =
    nodeCount ??
    Math.max(0, ...edges.flatMap((e) => [e.source, e.target])) + 1;

  const data: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const { source, target, weight = 1 } of edges) {
    if (source < n && target < n) {
      data[source][target] = weight;
    }
  }

  return { rows: n, cols: n, data, format: 'dense' };
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

/**
 * Execute a `graph-analyze` node.
 *
 * Expects `node.edges` to be an array of `{ source, target, weight? }` objects
 * (or a template string that resolves to one).  Runs PageRank and flags
 * anomalous nodes whose score exceeds `mean + 2 * stddev`.
 */
export async function executeGraphNode(
  node: GraphNode,
  ctx: ExecutionContext,
): Promise<GraphResult> {
  if (!GraphTools) {
    throw new Error(
      'sublinear-time-solver is not installed. Run `pnpm install` in apps/worker.',
    );
  }

  // Resolve edges — may be a template or a pre-built array
  const rawEdges: unknown =
    typeof node.edges === 'string'
      ? JSON.parse(renderTemplate(node.edges, ctx))
      : node.edges;

  if (!Array.isArray(rawEdges)) {
    throw new Error('graph-analyze node: `edges` must resolve to an array');
  }

  const edges = rawEdges as GraphEdge[];
  const adjacency = buildAdjacencyMatrix(edges, node.nodeCount);

  const pageRankResult = await GraphTools.pageRank({
    adjacency,
    damping: node.damping ?? 0.85,
    epsilon: node.epsilon ?? 1e-6,
    maxIterations: node.maxIterations ?? 1000,
  });

  const scores = pageRankResult.pageRankVector;
  const { mean, standardDeviation, maxScore, minScore, entropy, totalScore } =
    pageRankResult.statistics;

  // Flag anomalies: score > mean + 2σ
  const threshold = mean + 2 * standardDeviation;
  const anomalies = scores
    .map((score, node) => ({
      node,
      score,
      zScore: standardDeviation > 0 ? (score - mean) / standardDeviation : 0,
    }))
    .filter(({ score }) => score > threshold);

  return {
    scores,
    topNodes: pageRankResult.topNodes,
    anomalies,
    statistics: { mean, standardDeviation, maxScore, minScore, entropy, totalScore },
  };
}
