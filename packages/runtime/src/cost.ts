/**
 * Model pricing in cents per 1M tokens
 */
export interface ModelPricing {
  inputPer1M: number;  // cents
  outputPer1M: number; // cents
}

/**
 * Known model pricing (as of Jan 2025)
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': {
    inputPer1M: 250,   // $2.50
    outputPer1M: 1000, // $10.00
  },
  'gpt-4o-mini': {
    inputPer1M: 15,    // $0.15
    outputPer1M: 60,   // $0.60
  },
  'gpt-4-turbo': {
    inputPer1M: 1000,  // $10.00
    outputPer1M: 3000, // $30.00
  },
  'gpt-4': {
    inputPer1M: 3000,  // $30.00
    outputPer1M: 6000, // $60.00
  },
  'gpt-3.5-turbo': {
    inputPer1M: 50,    // $0.50
    outputPer1M: 150,  // $1.50
  },
  // Claude models (for future support)
  'claude-3-opus': {
    inputPer1M: 1500,  // $15.00
    outputPer1M: 7500, // $75.00
  },
  'claude-3-sonnet': {
    inputPer1M: 300,   // $3.00
    outputPer1M: 1500, // $15.00
  },
  'claude-3-haiku': {
    inputPer1M: 25,    // $0.25
    outputPer1M: 125,  // $1.25
  },
};

/**
 * Calculate cost in cents for token usage
 */
const DEFAULT_PRICING: ModelPricing = { inputPer1M: 250, outputPer1M: 1000 };

export function calculateCostCents(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;

  const inputCost = (tokensIn / 1_000_000) * pricing.inputPer1M;
  const outputCost = (tokensOut / 1_000_000) * pricing.outputPer1M;

  // Round to nearest cent
  return Math.round(inputCost + outputCost);
}

/**
 * Estimate cost for a potential request
 */
export function estimateCost(
  model: string,
  estimatedInputTokens: number,
  maxOutputTokens: number
): {
  minCostCents: number;
  maxCostCents: number;
  avgCostCents: number;
} {
  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPer1M;
  const minOutputCost = 0; // Could return nothing
  const maxOutputCost = (maxOutputTokens / 1_000_000) * pricing.outputPer1M;
  // Assume average output is 30% of max
  const avgOutputCost = (maxOutputTokens * 0.3 / 1_000_000) * pricing.outputPer1M;

  return {
    minCostCents: Math.round(inputCost + minOutputCost),
    maxCostCents: Math.round(inputCost + maxOutputCost),
    avgCostCents: Math.round(inputCost + avgOutputCost),
  };
}

/**
 * Format cost in dollars
 */
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format token count
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}
