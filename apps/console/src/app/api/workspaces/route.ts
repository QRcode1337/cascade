import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(50).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { playbooks: true, runs: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Get workspaces error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = createWorkspaceSchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A workspace with this slug already exists' },
        { status: 400 }
      );
    }

    // Ensure user exists in database (sync from Supabase Auth)
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: { email: session.user.email!, name: session.user.name },
      create: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        userId: session.user.id,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Create workspace error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
