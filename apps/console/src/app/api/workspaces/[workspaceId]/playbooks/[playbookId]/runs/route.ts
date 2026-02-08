import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';
import { generateAgentOutput } from '@/lib/openai';

const createRunSchema = z.object({
  input: z.record(z.unknown()).optional(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string; playbookId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, playbookId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const runs = await prisma.run.findMany({
      where: {
        workspaceId,
        playbookVer: { playbookId },
      },
      include: {
        playbookVer: true,
        _count: { select: { steps: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Get runs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, playbookId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get the latest playbook version
    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!playbook || playbook.versions.length === 0) {
      return NextResponse.json({ error: 'Playbook not found or has no versions' }, { status: 404 });
    }

    const latestVersion = playbook.versions[0]!;

    const body = await request.json().catch(() => ({}));
    const { input } = createRunSchema.parse(body);

    // Parse workflow definition
    interface WorkflowStep {
      id: string;
      type: string;
      name: string;
      description: string;
      config: { agentSlug?: string; outputType?: string; systemPrompt?: string | null };
    }
    interface WorkflowDefinition {
      agent?: { slug: string; name: string; mission: string; systemPrompt?: string };
      lane?: string;
      steps: WorkflowStep[];
      inputs: Record<string, unknown>;
      outputs: string[];
    }
    const definition = latestVersion.definition as unknown as WorkflowDefinition;

    // Create a new run
    const run = await prisma.run.create({
      data: {
        workspaceId,
        playbookVerId: latestVersion.id,
        status: 'RUNNING',
        input: (input || {}) as object,
        startedAt: new Date(),
      },
      include: {
        playbookVer: true,
      },
    });

    // Create run steps for each workflow step
    const steps = definition.steps || [];
    for (let idx = 0; idx < steps.length; idx++) {
      const step = steps[idx]!;
      await prisma.runStep.create({
        data: {
          runId: run.id,
          idx,
          nodeId: step.id,
          kind: step.type,
          name: step.name,
          input: { description: step.description, config: step.config } as object,
          status: 'PENDING',
          idempotencyKey: `${run.id}-${step.id}`,
        },
      });
    }

    // Execute workflow asynchronously
    const runId = run.id;
    const runInput = input || {};
    setTimeout(async () => {
      try {
        const runSteps = await prisma.runStep.findMany({
          where: { runId },
          orderBy: { idx: 'asc' },
        });

        const stepOutputs: Record<string, unknown> = {};
        let totalTokensIn = 0;
        let totalTokensOut = 0;
        let totalCostCents = 0;

        for (const runStep of runSteps) {
          // Mark step as running
          await prisma.runStep.update({
            where: { id: runStep.id },
            data: { status: 'RUNNING', startedAt: new Date() },
          });

          const stepInput = runStep.input as {
            description?: string;
            config?: { outputType?: string; systemPrompt?: string | null }
          };
          const outputType = stepInput.config?.outputType || 'Unknown output';

          let stepOutput: object;
          let stepTokensIn = 0;
          let stepTokensOut = 0;
          let stepCostCents = 0;

          // Check if OpenAI API key is configured
          if (process.env.OPENAI_API_KEY) {
            try {
              // Generate real content using OpenAI
              const result = await generateAgentOutput(
                definition.agent?.name || 'CASCADE Agent',
                definition.agent?.mission || 'Generate professional outputs',
                definition.agent?.systemPrompt || stepInput.config?.systemPrompt || null,
                outputType,
                {
                  clientInfo: runInput as Record<string, unknown>,
                  previousOutputs: stepOutputs,
                }
              );

              stepOutput = {
                type: outputType,
                status: 'generated',
                content: result.content,
                model: result.model,
                tokensIn: result.tokensIn,
                tokensOut: result.tokensOut,
                costCents: result.costCents,
                generatedAt: new Date().toISOString(),
              };

              stepTokensIn = result.tokensIn;
              stepTokensOut = result.tokensOut;
              stepCostCents = result.costCents;
            } catch (aiError) {
              console.error('OpenAI generation failed:', aiError);
              // Fallback to placeholder on AI error
              stepOutput = {
                type: outputType,
                status: 'error',
                content: `Failed to generate: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
                generatedAt: new Date().toISOString(),
                fallback: true,
              };
            }
          } else {
            // No API key - use placeholder
            stepOutput = {
              type: outputType,
              status: 'placeholder',
              content: `[${outputType}] - Placeholder output from ${definition.agent?.name || 'Agent'}`,
              generatedAt: new Date().toISOString(),
              note: 'Set OPENAI_API_KEY environment variable for real AI generation.',
            };
          }

          totalTokensIn += stepTokensIn;
          totalTokensOut += stepTokensOut;
          totalCostCents += stepCostCents;
          stepOutputs[runStep.nodeId] = stepOutput;

          // Mark step as completed
          await prisma.runStep.update({
            where: { id: runStep.id },
            data: {
              status: 'SUCCEEDED',
              output: stepOutput as object,
              finishedAt: new Date(),
              tokensIn: stepTokensIn,
              tokensOut: stepTokensOut,
              costCents: stepCostCents,
            },
          });
        }

        // Mark run as completed with all outputs
        await prisma.run.update({
          where: { id: runId },
          data: {
            status: 'SUCCEEDED',
            output: {
              agent: definition.agent,
              lane: definition.lane,
              stepsCompleted: runSteps.length,
              outputs: stepOutputs,
              expectedOutputs: definition.outputs,
              timestamp: new Date().toISOString(),
              message: `Workflow completed. ${runSteps.length} steps executed.`,
            } as object,
            finishedAt: new Date(),
            tokensIn: totalTokensIn,
            tokensOut: totalTokensOut,
            costCents: totalCostCents,
          },
        });
      } catch (e) {
        console.error('Failed to execute run:', e);
        await prisma.run.update({
          where: { id: runId },
          data: {
            status: 'FAILED',
            error: e instanceof Error ? e.message : 'Unknown error',
            finishedAt: new Date(),
          },
        }).catch(() => {});
      }
    }, 100);

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error('Create run error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create run' },
      { status: 500 }
    );
  }
}
