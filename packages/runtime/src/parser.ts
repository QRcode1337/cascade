import { type PlaybookDefinition, PlaybookDefinitionSchema } from '@cascade/schemas';

export interface ParseResult {
  success: boolean;
  data?: PlaybookDefinition;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Parse and validate a playbook definition
 */
export function parsePlaybook(input: unknown): ParseResult {
  const result = PlaybookDefinitionSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  };
}

/**
 * Get the next node ID after executing a node
 */
export function getNextNodeId(
  node: PlaybookDefinition['nodes'][number],
  branchResult?: boolean
): string | null {
  if (node.type === 'branch') {
    return branchResult ? node.onTrue : node.onFalse;
  }

  if ('next' in node) {
    return node.next ?? null;
  }

  return null;
}

/**
 * Build a node lookup map for efficient access
 */
export function buildNodeMap(
  playbook: PlaybookDefinition
): Map<string, PlaybookDefinition['nodes'][number]> {
  const map = new Map<string, PlaybookDefinition['nodes'][number]>();
  for (const node of playbook.nodes) {
    map.set(node.id, node);
  }
  return map;
}

/**
 * Validate that a playbook has no cycles
 */
export function validateNoCycles(playbook: PlaybookDefinition): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const nodeMap = buildNodeMap(playbook);

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return true;

    const nextIds: string[] = [];
    if (node.type === 'branch') {
      nextIds.push(node.onTrue, node.onFalse);
    } else if ('next' in node && node.next) {
      nextIds.push(node.next);
    }

    for (const nextId of nextIds) {
      if (!visited.has(nextId)) {
        if (!dfs(nextId)) return false;
      } else if (recursionStack.has(nextId)) {
        return false; // Cycle detected
      }
    }

    recursionStack.delete(nodeId);
    return true;
  }

  return dfs(playbook.entry);
}
