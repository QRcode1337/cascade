import type { Logger } from 'pino';
import { prisma, Prisma } from '@cascade/db';
import {
  parsePlaybook,
  getNextNodeId,
  buildNodeMap,
  createContext,
  mergeStepOutput,
  addRuntimeMetadata,
  renderTemplate,
  renderObjectTemplates,
  evaluateCondition,
  checkGuardrails,
} from '@cascade/runtime';
import type { Node } from '@cascade/schemas';
import { executeLlmNode } from '../connectors/openai.js';
import { executeHttpNode } from '../connectors/http.js';
import { executeSlackNode } from '../connectors/slack.js';
import { publishToLinkedIn } from '../connectors/social-linkedin.js';
import { publishToMeta } from '../connectors/social-meta.js';
import { decryptSecret } from '../lib/secrets.js';

export async function executeRun(runId: string, logger: Logger) {
  // Load run with related data
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      playbookVer: {
        include: {
          playbook: true,
        },
      },
      workspace: {
        include: { guardrail: true, secrets: true },
      },
    },
  });

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const playbookVersion = run.playbookVer;
  if (!playbookVersion) {
    throw new Error(`No playbook version found for run: ${runId}`);
  }

  // Parse playbook definition
  const parseResult = parsePlaybook(playbookVersion.definition);
  if (!parseResult.success) {
    await markRunFailed(runId, `Invalid playbook: ${parseResult.errors.join(', ')}`);
    throw new Error(`Invalid playbook: ${parseResult.errors.join(', ')}`);
  }

  const playbook = parseResult.data!;
  const nodeMap = buildNodeMap(playbook.nodes);

  // Initialize execution context
  let context = createContext(run.input as Record<string, unknown>);
  context = addRuntimeMetadata(context, {
    runId,
    workspaceId: run.workspaceId,
    playbookId: playbookVersion.playbookId,
    startedAt: new Date(),
    currentStep: 0,
  });

  // Mark run as running
  await prisma.run.update({
    where: { id: runId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  let currentNodeId: string | null = playbook.entryNode;
  let stepIndex = 0;
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCostCents = 0;

  try {
    while (currentNodeId) {
      const node = nodeMap.get(currentNodeId);
      if (!node) {
        throw new Error(`Node not found: ${currentNodeId}`);
      }

      logger.info({ nodeId: currentNodeId, nodeType: node.type, step: stepIndex }, 'Executing node');

      // Check guardrails before execution
      if (run.workspace.guardrail) {
        const guardrailCheck = checkGuardrails(run.workspace.guardrail, {
          runTokens: totalTokensIn + totalTokensOut,
          dailyTokens: 0, // TODO: Calculate from UsageLog
          runCostCents: totalCostCents,
          dailyCostCents: 0,
        });

        if (!guardrailCheck.allowed) {
          throw new Error(`Guardrail exceeded: ${guardrailCheck.reason}`);
        }
      }

      // Create step record
      const step = await prisma.runStep.create({
        data: {
          runId,
          idx: stepIndex,
          nodeId: currentNodeId,
          name: node.name,
          kind: node.type,
          status: 'RUNNING',
          input: context as unknown as Prisma.JsonObject,
          idempotencyKey: `${runId}-${currentNodeId}-${stepIndex}`,
        },
      });

      try {
        // Execute node based on type
        const result = await executeNode(node, context, logger, run.workspace.secrets);

        totalTokensIn += result.tokensIn || 0;
        totalTokensOut += result.tokensOut || 0;
        totalCostCents += result.cost || 0;

        // Update step with success
        await prisma.runStep.update({
          where: { id: step.id },
          data: {
            status: 'SUCCEEDED',
            output: result.output as Prisma.JsonObject,
            tokensIn: result.tokensIn || 0,
            tokensOut: result.tokensOut || 0,
            costCents: result.cost || 0,
            finishedAt: new Date(),
          },
        });

        // Merge output into context
        if (node.type === 'llm' && node.saveAs) {
          context = mergeStepOutput(context, node.saveAs, result.output);
        } else if (node.type === 'transform' && node.saveAs) {
          context = mergeStepOutput(context, node.saveAs, result.output);
        } else if (node.type === 'social_schedule' && node.saveAs) {
          context = mergeStepOutput(context, node.saveAs, result.output);
        } else if (node.type === 'social_publish' && node.saveAs) {
          context = mergeStepOutput(context, node.saveAs, result.output);
        } else if (node.type === 'http') {
          context = mergeStepOutput(context, `http_${currentNodeId}`, result.output);
        }

        // Determine next node
        currentNodeId = getNextNodeId(node, context, evaluateCondition);
        stepIndex++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await prisma.runStep.update({
          where: { id: step.id },
          data: {
            status: 'FAILED',
            error: errorMessage,
            finishedAt: new Date(),
          },
        });

        throw error;
      }
    }

    // Mark run as succeeded
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'SUCCEEDED',
        output: context as unknown as Prisma.JsonObject,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        costCents: totalCostCents,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    await markRunFailed(runId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function markRunFailed(runId: string, error: string) {
  await prisma.run.update({
    where: { id: runId },
    data: {
      status: 'FAILED',
      error,
      finishedAt: new Date(),
    },
  });
}

interface NodeResult {
  output: unknown;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
}

async function executeNode(
  node: Node,
  context: Record<string, unknown>,
  logger: Logger,
  workspaceSecrets: Array<{ key: string; cipherText: Buffer; iv: Buffer; authTag: Buffer }>
): Promise<NodeResult> {
  switch (node.type) {
    case 'llm':
      return executeLlmNode(node, context);

    case 'http': {
      const renderedNode = {
        ...node,
        url: renderTemplate(node.url, context),
        headers: node.headers ? renderObjectTemplates(node.headers, context) : undefined,
        body: node.body ? renderObjectTemplates(node.body, context) : undefined,
      };
      return executeHttpNode(renderedNode);
    }

    case 'slack': {
      const message = renderTemplate(node.message, context);
      return executeSlackNode({ ...node, message });
    }

    case 'wait': {
      const ms = parseDuration(node.duration);
      logger.info({ duration: node.duration, ms }, 'Waiting');
      await new Promise((resolve) => setTimeout(resolve, ms));
      return { output: { waited: ms } };
    }

    case 'social_schedule': {
      const content = renderTemplate(node.content, context);
      const media = renderMedia(node.media, context);
      return {
        output: {
          mode: 'scheduled',
          channel: node.channel,
          publishAt: renderTemplate(node.publishAt, context),
          timezone: node.timezone,
          content,
          media,
        },
      };
    }

    case 'social_publish': {
      const content = renderTemplate(node.content, context);
      const media = renderMedia(node.media, context);

      try {
        if (node.channel === 'linkedin') {
          const credentialRefs = node.credentials?.linkedin;
          if (!credentialRefs) {
            throw new Error('Missing LinkedIn credential references on social_publish node.');
          }

          const accessToken = resolveSecretValue(workspaceSecrets, credentialRefs.accessToken.secretKey);
          const authorUrn = resolveSecretValue(workspaceSecrets, credentialRefs.authorUrn.secretKey);

          const publishResult = await publishToLinkedIn({
            accessToken,
            authorUrn,
            content,
            media,
          });

          if (!publishResult.ok) {
            throw new Error(`LinkedIn publish failed with status ${publishResult.status}`);
          }

          return {
            output: {
              mode: 'published',
              channel: node.channel,
              postId: publishResult.postId,
              status: publishResult.status,
              providerResponse: publishResult.body,
              content,
              media,
            },
          };
        }

        if (node.channel === 'meta') {
          const credentialRefs = node.credentials?.meta;
          if (!credentialRefs) {
            throw new Error('Missing Meta credential references on social_publish node.');
          }

          const accessToken = resolveSecretValue(workspaceSecrets, credentialRefs.accessToken.secretKey);
          const pageId = resolveSecretValue(workspaceSecrets, credentialRefs.pageId.secretKey);

          await publishToMeta({
            accessToken,
            pageId,
            content,
            media,
          });

          return {
            output: {
              mode: 'published',
              channel: node.channel,
              content,
              media,
            },
          };
        }

        throw new Error(`Unsupported social channel: ${node.channel}`);
      } catch (error) {
        if (node.fallbackMode !== 'manual_export') {
          throw error;
        }

        const reason = error instanceof Error ? error.message : 'Unknown publish error';
        logger.warn({ nodeId: node.id, reason }, 'Falling back to manual social export mode');

        return {
          output: {
            mode: 'manual_export',
            channel: node.channel,
            reason,
            content,
            media,
            metadata: {
              generatedAt: new Date().toISOString(),
              instructions: 'Copy content and upload referenced media assets in your social channel UI.',
            },
          },
        };
      }
    }

    case 'branch':
      // Branch evaluation happens in getNextNodeId
      return { output: { evaluated: true } };

    case 'transform': {
      // Transform uses expression evaluation (handled in runtime)
      const { evaluateExpression } = await import('@cascade/runtime');
      const result = evaluateExpression(node.expression, context);
      if (!result.success) {
        throw new Error(`Transform failed: ${result.error}`);
      }
      return { output: result.value };
    }

    default:
      throw new Error(`Unknown node type: ${(node as Node).type}`);
  }
}

function resolveSecretValue(
  workspaceSecrets: Array<{ key: string; cipherText: Buffer; iv: Buffer; authTag: Buffer }>,
  secretKey: string
): string {
  const secret = workspaceSecrets.find((item) => item.key === secretKey);
  if (!secret) {
    throw new Error(`Secret not found: ${secretKey}`);
  }

  return decryptSecret(secret.cipherText, secret.iv, secret.authTag);
}

function renderMedia(
  media: Array<{ url: string; mimeType?: string; title?: string; altText?: string }>,
  context: Record<string, unknown>
): Array<{ url: string; mimeType?: string; title?: string; altText?: string }> {
  return media.map((item) => renderObjectTemplates(item, context));
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m)$/);
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const value = match[1];
  const unit = match[2];
  if (!value || !unit) throw new Error(`Invalid duration: ${duration}`);
  return parseInt(value, 10) * (unit === 'm' ? 60000 : 1000);
}
