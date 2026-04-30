export interface GuardrailConfig {
  dailyTokenCap: number;
  dailyCostCapCents: number;
  perRunTokenCap: number;
  perRunCostCapCents: number;
}

export interface UsageMetrics {
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

export interface GuardrailCheck {
  allowed: boolean;
  reason?: string;
  reservedTokens?: number;
}

/**
 * Check if a step can proceed based on guardrails
 */
export function checkGuardrails(
  config: GuardrailConfig,
  runUsage: UsageMetrics,
  dailyUsage: UsageMetrics,
  estimatedTokens: number
): GuardrailCheck {
  // Check per-run token cap
  const runTotal = runUsage.tokensIn + runUsage.tokensOut;
  if (runTotal + estimatedTokens > config.perRunTokenCap) {
    return {
      allowed: false,
      reason: `Per-run token cap exceeded (${runTotal + estimatedTokens} > ${config.perRunTokenCap})`,
    };
  }

  // Check daily token cap
  const dailyTotal = dailyUsage.tokensIn + dailyUsage.tokensOut;
  if (dailyTotal + estimatedTokens > config.dailyTokenCap) {
    return {
      allowed: false,
      reason: `Daily token cap exceeded (${dailyTotal + estimatedTokens} > ${config.dailyTokenCap})`,
    };
  }

  // Check per-run cost cap
  if (runUsage.costCents > config.perRunCostCapCents) {
    return {
      allowed: false,
      reason: `Per-run cost cap exceeded ($${(runUsage.costCents / 100).toFixed(2)} > $${(config.perRunCostCapCents / 100).toFixed(2)})`,
    };
  }

  // Check daily cost cap
  if (dailyUsage.costCents > config.dailyCostCapCents) {
    return {
      allowed: false,
      reason: `Daily cost cap exceeded ($${(dailyUsage.costCents / 100).toFixed(2)} > $${(config.dailyCostCapCents / 100).toFixed(2)})`,
    };
  }

  return {
    allowed: true,
    reservedTokens: estimatedTokens,
  };
}

/**
 * Calculate the cost impact of token usage
 */
export function calculateCostImpact(
  config: GuardrailConfig,
  runUsage: UsageMetrics,
  dailyUsage: UsageMetrics,
  additionalCostCents: number
): GuardrailCheck {
  // Check per-run cost cap
  if (runUsage.costCents + additionalCostCents > config.perRunCostCapCents) {
    return {
      allowed: false,
      reason: `Per-run cost cap exceeded ($${((runUsage.costCents + additionalCostCents) / 100).toFixed(2)} > $${(config.perRunCostCapCents / 100).toFixed(2)})`,
    };
  }

  // Check daily cost cap
  if (dailyUsage.costCents + additionalCostCents > config.dailyCostCapCents) {
    return {
      allowed: false,
      reason: `Daily cost cap exceeded ($${((dailyUsage.costCents + additionalCostCents) / 100).toFixed(2)} > $${(config.dailyCostCapCents / 100).toFixed(2)})`,
    };
  }

  return { allowed: true };
}

/**
 * Calculate percentage of daily budget used
 */
export function getBudgetUsagePercent(
  config: GuardrailConfig,
  dailyUsage: UsageMetrics
): {
  tokenPercent: number;
  costPercent: number;
} {
  const dailyTotal = dailyUsage.tokensIn + dailyUsage.tokensOut;
  return {
    tokenPercent: Math.round((dailyTotal / config.dailyTokenCap) * 100),
    costPercent: Math.round((dailyUsage.costCents / config.dailyCostCapCents) * 100),
  };
}

/**
 * Estimate tokens remaining in daily budget
 */
export function getRemainingBudget(
  config: GuardrailConfig,
  dailyUsage: UsageMetrics
): {
  tokensRemaining: number;
  costCentsRemaining: number;
} {
  const dailyTotal = dailyUsage.tokensIn + dailyUsage.tokensOut;
  return {
    tokensRemaining: Math.max(0, config.dailyTokenCap - dailyTotal),
    costCentsRemaining: Math.max(0, config.dailyCostCapCents - dailyUsage.costCents),
  };
}
