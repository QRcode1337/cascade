import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';
import { encrypt } from '@/lib/crypto/secrets';

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

const createSecretSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be uppercase with underscores'),
  value: z.string().min(1).max(10000),
});

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

    const secrets = await prisma.secret.findMany({
      where: { workspaceId },
      select: {
        id: true,
        key: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { key: 'asc' },
    });

    // Return keys only, never the actual values
    return NextResponse.json(secrets);
  } catch (error) {
    console.error('Get secrets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch secrets' },
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
    const { key, value } = createSecretSchema.parse(body);

    // Check if secret already exists
    const existing = await prisma.secret.findUnique({
      where: { workspaceId_key: { workspaceId, key } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A secret with this key already exists' },
        { status: 400 }
      );
    }

    // Encrypt the value
    const { cipherText, iv, authTag } = encrypt(value);

    const secret = await prisma.secret.create({
      data: {
        workspaceId,
        key,
        cipherText,
        iv,
        authTag,
      },
      select: {
        id: true,
        key: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the action
    await prisma.secretAuditLog.create({
      data: {
        workspaceId,
        secretKey: key,
        action: 'CREATE',
      },
    });

    return NextResponse.json(secret, { status: 201 });
  } catch (error) {
    console.error('Create secret error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create secret' },
      { status: 500 }
    );
  }
}

