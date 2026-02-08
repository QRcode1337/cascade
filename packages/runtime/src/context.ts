/**
 * Execution context that flows through the playbook
 */
export interface ExecutionContext {
  // Original run input
  input: Record<string, unknown>;

  // Outputs from completed nodes (keyed by saveAs or node id)
  [key: string]: unknown;
}

/**
 * Create a new execution context
 */
export function createContext(
  input: Record<string, unknown> = {}
): ExecutionContext {
  return {
    input,
  };
}

/**
 * Set a value in the context
 */
export function setContextValue(
  ctx: ExecutionContext,
  key: string,
  value: unknown
): ExecutionContext {
  return {
    ...ctx,
    [key]: value,
  };
}

/**
 * Get a value from the context by path
 * Supports dot notation: "input.user.name"
 */
export function getContextValue(
  ctx: ExecutionContext,
  path: string
): unknown {
  const parts = path.split('.');
  let current: unknown = ctx;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Merge step output into context
 */
export function mergeStepOutput(
  ctx: ExecutionContext,
  nodeId: string,
  saveAs: string | undefined,
  output: unknown
): ExecutionContext {
  const key = saveAs ?? nodeId;
  return setContextValue(ctx, key, output);
}

/**
 * Metadata added to context during execution
 */
export interface RuntimeMetadata {
  runId: string;
  workspaceId: string;
  playbookId: string;
  startedAt: Date;
  currentStep: number;
}

/**
 * Add runtime metadata to context
 */
export function addRuntimeMetadata(
  ctx: ExecutionContext,
  metadata: RuntimeMetadata
): ExecutionContext {
  return {
    ...ctx,
    _meta: metadata,
  };
}
