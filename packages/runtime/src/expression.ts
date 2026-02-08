import { Parser } from 'expr-eval';

// Create a restricted parser instance
const parser = new Parser({
  operators: {
    // Arithmetic
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    remainder: true,
    power: true,

    // Comparison
    comparison: true,

    // Logical
    logical: true,

    // Ternary
    conditional: true,

    // String
    concatenate: true,

    // Disable potentially dangerous operators
    factorial: false,
    assignment: false,
    fndef: false,
  },
});

// Add safe functions
parser.functions.len = (arr: unknown[]) => arr?.length ?? 0;
parser.functions.lower = (str: string) => str?.toLowerCase() ?? '';
parser.functions.upper = (str: string) => str?.toUpperCase() ?? '';
parser.functions.trim = (str: string) => str?.trim() ?? '';
parser.functions.contains = (str: string, search: string) =>
  str?.includes(search) ?? false;
parser.functions.startsWith = (str: string, search: string) =>
  str?.startsWith(search) ?? false;
parser.functions.endsWith = (str: string, search: string) =>
  str?.endsWith(search) ?? false;
parser.functions.abs = Math.abs;
parser.functions.ceil = Math.ceil;
parser.functions.floor = Math.floor;
parser.functions.round = Math.round;
parser.functions.min = Math.min;
parser.functions.max = Math.max;

export interface EvalResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

/**
 * Safely evaluate an expression against a context
 */
export function evaluateExpression(
  expression: string,
  context: Record<string, unknown>
): EvalResult {
  try {
    const parsed = parser.parse(expression);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = parsed.evaluate(flattenContext(context) as any);
    return { success: true, value };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown evaluation error',
    };
  }
}

/**
 * Evaluate a boolean expression (for branch nodes)
 */
export function evaluateCondition(
  expression: string,
  context: Record<string, unknown>
): boolean {
  const result = evaluateExpression(expression, context);
  if (!result.success) {
    console.error('Expression evaluation failed:', result.error);
    return false;
  }
  return Boolean(result.value);
}

/**
 * Flatten nested context for expr-eval
 * ctx.input.name -> input_name (expr-eval uses _ for nested access)
 */
function flattenContext(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenContext(value as Record<string, unknown>, newKey)
      );
    } else {
      result[newKey] = value;
    }
  }

  // Also keep the original structure for direct access
  if (!prefix) {
    result['ctx'] = obj;
  }

  return result;
}

/**
 * Validate an expression without evaluating
 */
export function validateExpression(expression: string): {
  valid: boolean;
  error?: string;
} {
  try {
    parser.parse(expression);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid expression',
    };
  }
}
