import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';

const createPlaybookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  agentSlug: z.string().optional().nullable(),
  lane: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const playbooks = await prisma.playbook.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { versions: true, triggers: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(playbooks);
  } catch (error) {
    console.error('Get playbooks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbooks' },
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

    const { workspaceId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, agentSlug, lane } = createPlaybookSchema.parse(body);

    // Check if playbook with same name exists in workspace
    const existing = await prisma.playbook.findFirst({
      where: { workspaceId, name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A playbook with this name already exists in this workspace' },
        { status: 400 }
      );
    }

    // Ensure new columns exist (migration might not have run)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Playbook" ADD COLUMN IF NOT EXISTS "agentSlug" TEXT`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Playbook" ADD COLUMN IF NOT EXISTS "templateId" TEXT`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Playbook" ADD COLUMN IF NOT EXISTS "lane" TEXT`).catch(() => {});

    // Build workflow definition based on agent if provided
    interface WorkflowDefinition {
      agent?: { slug: string; name: string; mission: string; systemPrompt?: string };
      lane?: string;
      steps: Array<{ id: string; type: string; name: string; description: string; config: object }>;
      inputs: Record<string, { type: string; description: string; required: boolean }>;
      outputs: string[];
    }

    let workflowDefinition: WorkflowDefinition = {
      steps: [],
      inputs: {},
      outputs: [],
    };

    // If agent is provided, fetch agent details and build workflow
    if (agentSlug) {
      interface AgentRecord {
        slug: string;
        name: string;
        mission: string;
        systemPrompt: string | null;
        playbooks: string[];
        outputs: string[];
        lane: string | null;
      }
      const agents = await prisma.$queryRaw<AgentRecord[]>`
        SELECT slug, name, mission, "systemPrompt", playbooks, outputs, lane
        FROM "Agent"
        WHERE slug = ${agentSlug}
        LIMIT 1
      `.catch(() => []);

      const agent = agents[0];
      if (agent) {
        // Build workflow steps based on agent outputs
        const steps = agent.outputs.map((output, idx) => ({
          id: `step_${idx + 1}`,
          type: 'agent_task',
          name: `Generate: ${output.split(' ')[0]}`,
          description: output,
          config: {
            agentSlug: agent.slug,
            outputType: output,
            systemPrompt: agent.systemPrompt,
          },
        }));

        workflowDefinition = {
          agent: {
            slug: agent.slug,
            name: agent.name,
            mission: agent.mission,
            systemPrompt: agent.systemPrompt || undefined,
          },
          lane: lane || agent.lane || undefined,
          steps,
          inputs: {
            client_or_prospect: {
              type: 'object',
              description: 'Client/prospect info: name, industry, location, website, goal',
              required: true,
            },
            constraints: {
              type: 'object',
              description: 'Budget, tools, compliance requirements',
              required: false,
            },
            artifacts: {
              type: 'array',
              description: 'Notes, links, and reference materials',
              required: false,
            },
          },
          outputs: agent.outputs,
        };
      }
    }

    // Create playbook with workflow definition
    const playbook = await prisma.playbook.create({
      data: {
        name,
        description,
        workspaceId,
        versions: {
          create: {
            version: 1,
            definition: workflowDefinition as object,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Update with agent and lane if provided (columns might be new)
    if (agentSlug || lane) {
      await prisma.$executeRawUnsafe(`
        UPDATE "Playbook" SET "agentSlug" = $1, "lane" = $2 WHERE id = $3
      `, agentSlug || null, lane || null, playbook.id).catch(() => {});
    }

    return NextResponse.json(playbook, { status: 201 });
  } catch (error) {
    console.error('Create playbook error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create playbook' },
      { status: 500 }
    );
  }
}
