import { prisma } from '@cascade/db';
import {
  buildNodeMap,
  createContext,
  getNextNodeId,
  mergeStepOutput,
  type ExecutionContext,
} from '@cascade/runtime';
import type { PlaybookDefinition, Node } from '@cascade/schemas';

import type { ExecuteRunPayload } from './queue';
import { executeLlmNode } from './executors/llm';
import { executeHttpNode } from './executors/http';
import { executeBranchNode } from './executors/branch';

export async function executeRun(payload: ExecuteRunPayload): Promise<void> {
  const { runId, playbookVersionId } = payload;

  // Load run and playbook
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { playbookVer: true },
  });

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  // Mark run as running
  await prisma.run.update({
    where: { id: runId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  const definition = run.playbookVer.definition as PlaybookDefinition;
  const nodeMap = buildNodeMap(definition);
  let ctx = createContext((run.input as Record<string, unknown>) || {});
  let currentNodeId: string | null = definition.entry;
  let stepIdx = 0;

  try {
    while (currentNodeId) {
      const node = nodeMap.get(currentNodeId);
      if (!node) {
        throw new Error(`Node not found: ${currentNodeId}`);
      }

      // Create step record
      const idempotencyKey = `${runId}:${stepIdx}`;
      const existingStep = await prisma.runStep.findUnique({
        where: { idempotencyKey },
      });

      if (existingStep?.status === 'SUCCEEDED') {
        // Skip already completed step
        if (existingStep.output) {
          const saveAs = 'saveAs' in node ? node.saveAs : undefined;
          ctx = mergeStepOutput(ctx, node.id, saveAs, existingStep.output);
        }
        const branchResult = node.type === 'branch' ? Boolean(existingStep.output) : undefined;
        currentNodeId = getNextNodeId(node, branchResult);
        stepIdx++;
        continue;
      }

      // Create or update step
      const step = await prisma.runStep.upsert({
        where: { idempotencyKey },
        create: {
          runId,
          idx: stepIdx,
          nodeId: node.id,
          kind: node.type,
          name: node.name,
          input: ctx,
          status: 'RUNNING',
          startedAt: new Date(),
          idempotencyKey,
        },
        update: {
          status: 'RUNNING',
          startedAt: new Date(),
          retryCount: { increment: 1 },
        },
      });

      // Execute node
      const result = await executeNode(node, ctx);

      // Update step with result
      await prisma.runStep.update({
        where: { id: step.id },
        data: {
          output: result.output,
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          tokensIn: result.tokensIn ?? 0,
          tokensOut: result.tokensOut ?? 0,
          costCents: result.costCents ?? 0,
        },
      });

      // Update run totals
      await prisma.run.update({
        where: { id: runId },
        data: {
          tokensIn: { increment: result.tokensIn ?? 0 },
          tokensOut: { increment: result.tokensOut ?? 0 },
          costCents: { increment: result.costCents ?? 0 },
        },
      });

      // Update context
      if (result.output !== undefined) {
        const saveAs = 'saveAs' in node ? node.saveAs : undefined;
        ctx = mergeStepOutput(ctx, node.id, saveAs, result.output);
      }

      // Get next node
      currentNodeId = getNextNodeId(node, result.branchResult);
      stepIdx++;
    }

    // Mark run as succeeded
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'SUCCEEDED',
        finishedAt: new Date(),
        output: ctx,
      },
    });
  } catch (err) {
    // Mark run as failed
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    });
    throw err;
  }
}

interface NodeResult {
  output?: unknown;
  branchResult?: boolean;
  tokensIn?: number;
  tokensOut?: number;
  costCents?: number;
}

async function executeNode(node: Node, ctx: ExecutionContext): Promise<NodeResult> {
  switch (node.type) {
    case 'llm':
      return executeLlmNode(node, ctx);
    case 'http':
      return executeHttpNode(node, ctx);
    case 'branch':
      return executeBranchNode(node, ctx);
    case 'slack':
      // TODO: Implement Slack executor
      return { output: { sent: true } };
    case 'wait':
      await new Promise((resolve) => setTimeout(resolve, node.duration));
      return { output: { waited: node.duration } };
    case 'transform':
      // TODO: Implement transform executor
      return { output: null };
    default:
      throw new Error(`Unknown node type: ${(node as Node).type}`);
  }
}
