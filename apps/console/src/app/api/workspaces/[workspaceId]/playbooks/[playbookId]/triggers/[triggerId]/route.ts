import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';

const updateTriggerSchema = z.object({
  type: z.enum(['SCHEDULE', 'WEBHOOK', 'MANUAL']).optional(),
  config: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string; playbookId: string; triggerId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, playbookId, triggerId } = await context.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const trigger = await prisma.trigger.findFirst({
      where: { id: triggerId, playbookId, playbook: { workspaceId } },
    });

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    return NextResponse.json(trigger);
  } catch (error) {
    console.error('Get trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trigger' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, playbookId, triggerId } = await context.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const existingTrigger = await prisma.trigger.findFirst({
      where: { id: triggerId, playbookId, playbook: { workspaceId } },
    });

    if (!existingTrigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = updateTriggerSchema.parse(body);

    const trigger = await prisma.trigger.update({
      where: { id: triggerId },
      data: {
        ...updates,
        config: updates.config ? (updates.config as object) : undefined,
      },
    });

    return NextResponse.json(trigger);
  } catch (error) {
    console.error('Update trigger error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update trigger' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, playbookId, triggerId } = await context.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const existingTrigger = await prisma.trigger.findFirst({
      where: { id: triggerId, playbookId, playbook: { workspaceId } },
    });

    if (!existingTrigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    await prisma.trigger.delete({
      where: { id: triggerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to delete trigger' },
      { status: 500 }
    );
  }
}
