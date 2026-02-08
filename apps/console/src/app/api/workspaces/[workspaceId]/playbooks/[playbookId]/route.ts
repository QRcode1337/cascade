import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';

const updatePlaybookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  definition: z.record(z.unknown()).optional(),
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

    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId },
      include: {
        versions: { orderBy: { version: 'desc' } },
        triggers: true,
        _count: { select: { versions: true, triggers: true } },
      },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    return NextResponse.json(playbook);
  } catch (error) {
    console.error('Get playbook error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbook' },
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

    const { workspaceId, playbookId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const existingPlaybook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!existingPlaybook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, definition } = updatePlaybookSchema.parse(body);

    // Check if name is being changed and if it conflicts
    if (name && name !== existingPlaybook.name) {
      const nameExists = await prisma.playbook.findFirst({
        where: { workspaceId, name, id: { not: playbookId } },
      });
      if (nameExists) {
        return NextResponse.json(
          { error: 'A playbook with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update playbook metadata
    const updateData: { name?: string; description?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await prisma.playbook.update({
      where: { id: playbookId },
      data: updateData,
    });

    // Create new version if definition changed
    if (definition) {
      const latestVersion = existingPlaybook.versions[0];
      const newVersionNumber = (latestVersion?.version || 0) + 1;

      await prisma.playbookVersion.create({
        data: {
          playbookId,
          version: newVersionNumber,
          definition: definition as object,
        },
      });
    }

    // Fetch updated playbook with versions
    const updatedPlaybook = await prisma.playbook.findUnique({
      where: { id: playbookId },
      include: {
        versions: { orderBy: { version: 'desc' } },
        triggers: true,
      },
    });

    return NextResponse.json(updatedPlaybook);
  } catch (error) {
    console.error('Update playbook error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update playbook' },
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

    const { workspaceId, playbookId } = await context.params;

    // Verify workspace belongs to user
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

    await prisma.playbook.delete({
      where: { id: playbookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete playbook error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playbook' },
      { status: 500 }
    );
  }
}
