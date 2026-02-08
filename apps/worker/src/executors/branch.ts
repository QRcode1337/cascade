import { evaluateCondition, type ExecutionContext } from '@cascade/runtime';
import type { BranchNode } from '@cascade/schemas';

interface BranchResult {
  output: boolean;
  branchResult: boolean;
}

export async function executeBranchNode(
  node: BranchNode,
  ctx: ExecutionContext
): Promise<BranchResult> {
  const result = evaluateCondition(node.expression, ctx);

  return {
    output: result,
    branchResult: result,
  };
}
