import type { Logger } from "pino";
import { prisma, Prisma } from "@cascade/db";
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
} from "@cascade/runtime";
import type { Node, PlaybookDefinition } from "@cascade/schemas";
import { executeLlmNode } from "../connectors/openai.js";
import { executeHttpNode } from "../connectors/http.js";
import { executeSlackNode } from "../connectors/slack.js";
import { checkRateLimit } from "../middleware/rate-limiter.js";
import { sendGuardrailBreachAlert } from "../lib/guardrail-alert.js";

const RETRYABLE_NODE_TYPES = new Set(["llm", "http"]);
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDailyUsageForWorkspace(workspaceId: string) {
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);
  const result = await prisma.usageLog.aggregate({
    where: { workspaceId, timestamp: { gte: startOfDayUtc } },
    _sum: { tokensIn: true, tokensOut: true, costCents: true },
  });
  return {
    tokensIn: result._sum.tokensIn ?? 0,
    tokensOut: result._sum.tokensOut ?? 0,
    costCents: result._sum.costCents ?? 0,
  };
}

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
        include: { guardrail: true },
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

  // Parse playbook definition (support legacy console workflow shape)
  const normalizedDefinition = normalizePlaybookDefinition(
    playbookVersion.definition,
  );
  const parseResult = parsePlaybook(normalizedDefinition);
  if (!parseResult.success) {
    const errors = (parseResult.errors || [])
      .map((err) => `${err.path}: ${err.message}`)
      .join(", ");
    await markRunFailed(runId, `Invalid playbook: ${errors}`);
    throw new Error(`Invalid playbook: ${errors}`);
  }

  const playbook = parseResult.data!;
  const nodeMap = buildNodeMap(playbook);

  // Enforce per-workspace rate limit before consuming any resources
  checkRateLimit(run.workspaceId);

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
    data: { status: "RUNNING", startedAt: new Date() },
  });

  let currentNodeId: string | null = playbook.entry;
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

      logger.info(
        { nodeId: currentNodeId, nodeType: node.type, step: stepIndex },
        "Executing node",
      );

      // Check guardrails before execution
      if (run.workspace.guardrail) {
        const dailyUsage = await getDailyUsageForWorkspace(run.workspaceId);
        const guardrailCheck = checkGuardrails(
          run.workspace.guardrail,
          { tokensIn: totalTokensIn, tokensOut: totalTokensOut, costCents: totalCostCents },
          dailyUsage,
          0,
        );
        if (!guardrailCheck.allowed) {
          // Fire-and-forget alert — must not delay or suppress the breach error.
          void sendGuardrailBreachAlert(
            {
              workspaceId: run.workspaceId,
              workspaceName: run.workspace.name,
              runId,
              reason: guardrailCheck.reason ?? 'limit exceeded',
            },
            logger,
          );
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
          status: "RUNNING",
          input: context as unknown as Prisma.JsonObject,
          idempotencyKey: `${runId}-${currentNodeId}-${stepIndex}`,
        },
      });

      try {
        // Execute node with retry for LLM and HTTP steps
        const isRetryable = RETRYABLE_NODE_TYPES.has(node.type);
        let result!: NodeResult;
        for (let attempt = 1; attempt <= (isRetryable ? MAX_RETRIES : 1); attempt++) {
          try {
            result = await executeNode(node, context, logger);
            break;
          } catch (err) {
            const isLast = attempt === MAX_RETRIES || !isRetryable;
            if (isLast) throw err;
            const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
            logger.warn({ nodeId: currentNodeId, attempt, delayMs }, 'Step failed, retrying');
            await prisma.runStep.update({ where: { id: step.id }, data: { retryCount: attempt } });
            await sleep(delayMs);
          }
        }

        totalTokensIn += result.tokensIn || 0;
        totalTokensOut += result.tokensOut || 0;
        totalCostCents += result.cost || 0;

        // Update step with success
        await prisma.runStep.update({
          where: { id: step.id },
          data: {
            status: "SUCCEEDED",
            output: result.output as Prisma.JsonObject,
            tokensIn: result.tokensIn || 0,
            tokensOut: result.tokensOut || 0,
            costCents: result.cost || 0,
            finishedAt: new Date(),
          },
        });

        // Merge output into context
        if (node.type === "llm" && node.saveAs) {
          context = mergeStepOutput(
            context,
            node.id,
            node.saveAs,
            result.output,
          );
        } else if (node.type === "transform" && node.saveAs) {
          context = mergeStepOutput(
            context,
            node.id,
            node.saveAs,
            result.output,
          );
        } else if (node.type === "http") {
          context = mergeStepOutput(context, node.id, undefined, result.output);
        }

        // Determine next node
        const branchResult =
          node.type === "branch"
            ? evaluateCondition(node.expression, context)
            : undefined;
        currentNodeId = getNextNodeId(node, branchResult);
        stepIndex++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await prisma.runStep.update({
          where: { id: step.id },
          data: {
            status: "FAILED",
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
        status: "SUCCEEDED",
        output: context as unknown as Prisma.JsonObject,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        costCents: totalCostCents,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    await markRunFailed(
      runId,
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}

async function markRunFailed(runId: string, error: string) {
  await prisma.run.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      error,
      finishedAt: new Date(),
    },
  });
}

interface LegacyWorkflowStep {
  id: string;
  name?: string;
  description?: string;
  config?: {
    outputType?: string;
    systemPrompt?: string | null;
  };
}

interface LegacyWorkflowDefinition {
  agent?: {
    name?: string;
    mission?: string;
    systemPrompt?: string;
  };
  steps?: LegacyWorkflowStep[];
}

function normalizePlaybookDefinition(definition: unknown): unknown {
  const parsed = parsePlaybook(definition);
  if (parsed.success) {
    return definition;
  }

  if (!isLegacyWorkflow(definition) || !definition.steps?.length) {
    return definition;
  }

  const nodes: PlaybookDefinition["nodes"] = definition.steps.map(
    (step, idx) => {
      const isLast = idx === definition.steps!.length - 1;
      const outputType =
        step.config?.outputType || step.description || `Output ${idx + 1}`;

      return {
        id: step.id || `step_${idx + 1}`,
        type: "llm",
        name: step.name || `Step ${idx + 1}`,
        model: "gpt-4o",
        system:
          step.config?.systemPrompt ||
          definition.agent?.systemPrompt ||
          undefined,
        prompt: [
          definition.agent?.mission || "Generate a professional output.",
          `Output requested: ${outputType}`,
          "Use available context from prior steps and inputs when relevant.",
        ].join("\n"),
        maxOutputTokens: 2048,
        temperature: 0.7,
        saveAs: step.id || `step_${idx + 1}`,
        next: isLast
          ? undefined
          : definition.steps![idx + 1]!.id || `step_${idx + 2}`,
      };
    },
  );

  return {
    version: 1,
    entry: nodes[0]?.id,
    nodes,
  } satisfies PlaybookDefinition;
}

function isLegacyWorkflow(value: unknown): value is LegacyWorkflowDefinition {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as LegacyWorkflowDefinition).steps)
  );
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
): Promise<NodeResult> {
  switch (node.type) {
    case "llm":
      return executeLlmNode(node, context);

    case "http": {
      const renderedNode = {
        ...node,
        url: renderTemplate(node.url, context),
        headers: node.headers
          ? renderObjectTemplates(node.headers, context)
          : undefined,
        body: node.body ? renderObjectTemplates(node.body, context) : undefined,
      };
      return executeHttpNode(renderedNode);
    }

    case "slack": {
      const message = renderTemplate(node.message, context);
      return executeSlackNode({ ...node, message });
    }

    case "wait": {
      const ms = parseDuration(node.duration);
      logger.info({ duration: node.duration, ms }, "Waiting");
      await new Promise((resolve) => setTimeout(resolve, ms));
      return { output: { waited: ms } };
    }

    case "branch":
      // Branch evaluation happens in getNextNodeId
      return { output: { evaluated: true } };

    case "transform": {
      // Transform uses expression evaluation (handled in runtime)
      const { evaluateExpression } = await import("@cascade/runtime");
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

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m)$/);
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const [, value, unit] = match;
  return parseInt(value, 10) * (unit === "m" ? 60000 : 1000);
}
