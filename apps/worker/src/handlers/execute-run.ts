import crypto from "crypto";
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
import type { Node } from "@cascade/schemas";
import { executeLlmNode } from "../connectors/openai.js";
import { executeHttpNode } from "../connectors/http.js";
import { executeSlackNode } from "../connectors/slack.js";

const ENCRYPTION_KEY =
  process.env.SECRETS_ENCRYPTION_KEY || "default-key-change-in-production-32";
const ALGORITHM = "aes-256-gcm";

export async function executeRun(runId: string, logger: Logger) {
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

  const parseResult = parsePlaybook(playbookVersion.definition);
  if (!parseResult.success) {
    await markRunFailed(
      runId,
      `Invalid playbook: ${parseResult.errors.join(", ")}`,
    );
    throw new Error(`Invalid playbook: ${parseResult.errors.join(", ")}`);
  }

  const playbook = parseResult.data!;
  const nodeMap = buildNodeMap(playbook.nodes);

  let context = createContext(run.input as Record<string, unknown>);
  const resolvedSecrets = await loadWorkspaceSecrets(run.workspaceId, run.id);
  context = mergeStepOutput(context, "secrets", resolvedSecrets);

  context = addRuntimeMetadata(context, {
    runId,
    workspaceId: run.workspaceId,
    playbookId: playbookVersion.playbookId,
    startedAt: new Date(),
    currentStep: 0,
  });

  await prisma.run.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: new Date() },
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

      logger.info(
        { nodeId: currentNodeId, nodeType: node.type, step: stepIndex },
        "Executing node",
      );

      const dailyUsage = await getDailyUsage(run.workspaceId);

      if (run.workspace.guardrail) {
        const guardrailCheck = checkGuardrails(run.workspace.guardrail, {
          runTokens: totalTokensIn + totalTokensOut,
          dailyTokens: dailyUsage.tokensIn + dailyUsage.tokensOut,
          runCostCents: totalCostCents,
          dailyCostCents: dailyUsage.costCents,
        });

        if (!guardrailCheck.allowed) {
          throw new Error(`Guardrail exceeded: ${guardrailCheck.reason}`);
        }
      }

      enforceConsentPolicy(node, context);

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

      const startTime = Date.now();

      try {
        const result = await executeNode(node, context, logger, {
          runId,
          workspaceId: run.workspaceId,
          stepId: step.id,
        });

        const durationMs = Date.now() - startTime;
        totalTokensIn += result.tokensIn || 0;
        totalTokensOut += result.tokensOut || 0;
        totalCostCents += result.cost || 0;

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

        await prisma.usageLog.create({
          data: {
            workspaceId: run.workspaceId,
            runId,
            stepId: step.id,
            tokensIn: result.tokensIn || 0,
            tokensOut: result.tokensOut || 0,
            costCents: result.cost || 0,
            timestamp: new Date(),
          },
        });

        logger.info({ runId, stepId: step.id, durationMs }, "Step succeeded");

        if (node.type === "llm" && node.saveAs) {
          context = mergeStepOutput(context, node.saveAs, result.output);
        } else if (node.type === "transform" && node.saveAs) {
          context = mergeStepOutput(context, node.saveAs, result.output);
        } else if (node.type === "http") {
          context = mergeStepOutput(
            context,
            `http_${currentNodeId}`,
            result.output,
          );
        }

        currentNodeId = getNextNodeId(node, context, evaluateCondition);
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

interface NodeResult {
  output: unknown;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
}

interface ExecutionAuditContext {
  workspaceId: string;
  runId: string;
  stepId: string;
}

async function executeNode(
  node: Node,
  context: Record<string, unknown>,
  logger: Logger,
  auditContext: ExecutionAuditContext,
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

      const destination = safeDestinationFromUrl(renderedNode.url);
      await writeRunAudit({
        ...auditContext,
        actor: "worker",
        action: "connector.http.request",
        channel: "http",
        destination,
        metadata: { method: renderedNode.method },
      });

      return executeHttpNode(renderedNode);
    }

    case "slack": {
      const message = renderTemplate(node.message, context);
      await writeRunAudit({
        ...auditContext,
        actor: "worker",
        action: "connector.slack.post_message",
        channel: "slack",
        destination: node.channel,
      });
      return executeSlackNode({ ...node, message });
    }

    case "wait": {
      const ms = parseDuration(node.duration);
      logger.info({ duration: node.duration, ms }, "Waiting");
      await new Promise((resolve) => setTimeout(resolve, ms));
      return { output: { waited: ms } };
    }

    case "branch":
      return { output: { evaluated: true } };

    case "transform": {
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
  const value = match[1]!;
  const unit = match[2]!;
  return parseInt(value, 10) * (unit === "m" ? 60000 : 1000);
}

async function getDailyUsage(
  workspaceId: string,
): Promise<{ tokensIn: number; tokensOut: number; costCents: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const aggregate = await prisma.usageLog.aggregate({
    where: {
      workspaceId,
      timestamp: {
        gte: startOfDay,
      },
    },
    _sum: {
      tokensIn: true,
      tokensOut: true,
      costCents: true,
    },
  });

  return {
    tokensIn: aggregate._sum.tokensIn ?? 0,
    tokensOut: aggregate._sum.tokensOut ?? 0,
    costCents: aggregate._sum.costCents ?? 0,
  };
}

function enforceConsentPolicy(node: Node, context: Record<string, unknown>) {
  if (node.type !== "http" && node.type !== "slack") {
    return;
  }

  const rawInput = JSON.stringify({ node, context }).toLowerCase();
  const messagingWorkflow =
    /\bsms\b|social dm|direct message|whatsapp|twilio|instagram dm|linkedin dm/.test(
      rawInput,
    );

  if (!messagingWorkflow) {
    return;
  }

  const consentContext = context as {
    consent?: { messaging?: boolean; sms?: boolean; socialDm?: boolean };
    user?: {
      consent?: { messaging?: boolean; sms?: boolean; socialDm?: boolean };
    };
  };

  const hasConsent =
    consentContext.consent?.messaging === true ||
    consentContext.consent?.sms === true ||
    consentContext.consent?.socialDm === true ||
    consentContext.user?.consent?.messaging === true ||
    consentContext.user?.consent?.sms === true ||
    consentContext.user?.consent?.socialDm === true;

  if (!hasConsent) {
    throw new Error(
      "Consent policy check failed: messaging automation requires explicit consent in run context",
    );
  }
}

async function loadWorkspaceSecrets(
  workspaceId: string,
  runId: string,
): Promise<Record<string, string>> {
  const secrets = await prisma.secret.findMany({
    where: { workspaceId },
    select: { key: true, cipherText: true, iv: true, authTag: true },
  });

  const resolved: Record<string, string> = {};

  for (const secret of secrets) {
    resolved[secret.key] = decryptSecret(
      secret.cipherText,
      secret.iv,
      secret.authTag,
    );

    await writeRunAudit({
      workspaceId,
      runId,
      actor: "worker",
      action: "secret.access",
      channel: "secret_store",
      destination: secret.key,
      metadata: { access: "read" },
    });
  }

  return resolved;
}

function decryptSecret(
  cipherText: Buffer,
  iv: Buffer,
  authTag: Buffer,
): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(cipherText),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

async function writeRunAudit(params: {
  workspaceId: string;
  runId: string;
  stepId?: string;
  actor: string;
  action: string;
  channel?: string;
  destination?: string;
  metadata?: Prisma.JsonObject;
}) {
  await prisma.runAuditLog.create({
    data: {
      workspaceId: params.workspaceId,
      runId: params.runId,
      stepId: params.stepId,
      actor: params.actor,
      action: params.action,
      channel: params.channel,
      destination: params.destination,
      timestamp: new Date(),
      metadata: params.metadata,
    },
  });
}

function safeDestinationFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}
