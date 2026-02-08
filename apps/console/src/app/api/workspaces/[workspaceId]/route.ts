import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  guardrails: z.object({
    dailyTokenCap: z.number().int().positive().optional(),
    dailyCostCapCents: z.number().int().positive().optional(),
    perRunTokenCap: z.number().int().positive().optional(),
    perRunCostCapCents: z.number().int().positive().optional(),
  }).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await context.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
      include: {
        guardrail: true,
        _count: { select: { playbooks: true, runs: true } },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Get workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
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

    const { workspaceId } = await context.params;

    // Verify ownership
    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, guardrails } = updateWorkspaceSchema.parse(body);

    // Update workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name && { name }),
        updatedAt: new Date(),
      },
    });

    // Update or create guardrails
    if (guardrails) {
      await prisma.guardrail.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          dailyTokenCap: guardrails.dailyTokenCap ?? 250000,
          dailyCostCapCents: guardrails.dailyCostCapCents ?? 1000,
          perRunTokenCap: guardrails.perRunTokenCap ?? 200000,
          perRunCostCapCents: guardrails.perRunCostCapCents ?? 500,
        },
        update: {
          ...(guardrails.dailyTokenCap !== undefined && { dailyTokenCap: guardrails.dailyTokenCap }),
          ...(guardrails.dailyCostCapCents !== undefined && { dailyCostCapCents: guardrails.dailyCostCapCents }),
          ...(guardrails.perRunTokenCap !== undefined && { perRunTokenCap: guardrails.perRunTokenCap }),
          ...(guardrails.perRunCostCapCents !== undefined && { perRunCostCapCents: guardrails.perRunCostCapCents }),
        },
      });
    }

    // Fetch updated workspace with guardrails
    const updatedWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { guardrail: true },
    });

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error('Update workspace error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update workspace' },
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

    const { workspaceId } = await context.params;

    // Verify ownership
    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Delete workspace (cascades to playbooks, runs, etc.)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
