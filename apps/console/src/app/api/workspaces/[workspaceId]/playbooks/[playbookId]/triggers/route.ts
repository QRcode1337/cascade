import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';

const createTriggerSchema = z.object({
  type: z.enum(['SCHEDULE', 'WEBHOOK', 'MANUAL']),
  config: z.record(z.unknown()).optional(),
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

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const triggers = await prisma.trigger.findMany({
      where: { playbookId, playbook: { workspaceId } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(triggers);
  } catch (error) {
    console.error('Get triggers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch triggers' },
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

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, config } = createTriggerSchema.parse(body);

    const trigger = await prisma.trigger.create({
      data: {
        playbookId,
        workspaceId,
        type,
        config: (config || {}) as object,
        enabled: true,
      },
    });

    return NextResponse.json(trigger, { status: 201 });
  } catch (error) {
    console.error('Create trigger error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create trigger' },
      { status: 500 }
    );
  }
}
