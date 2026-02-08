import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';
import { encrypt } from '@/lib/crypto/secrets';

interface RouteContext {
  params: Promise<{ workspaceId: string; secretId: string }>;
}

const updateSecretSchema = z.object({
  value: z.string().min(1).max(10000),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, secretId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Find the secret
    const existing = await prisma.secret.findFirst({
      where: { id: secretId, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    const body = await request.json();
    const { value } = updateSecretSchema.parse(body);

    // Encrypt the new value
    const { cipherText, iv, authTag } = encrypt(value);

    const secret = await prisma.secret.update({
      where: { id: secretId },
      data: {
        cipherText,
        iv,
        authTag,
        updatedAt: new Date(),
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
        secretKey: existing.key,
        action: 'UPDATE',
      },
    });

    return NextResponse.json(secret);
  } catch (error) {
    console.error('Update secret error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update secret' },
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

    const { workspaceId, secretId } = await context.params;

    // Verify workspace belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Find the secret
    const existing = await prisma.secret.findFirst({
      where: { id: secretId, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    await prisma.secret.delete({
      where: { id: secretId },
    });

    // Log the action
    await prisma.secretAuditLog.create({
      data: {
        workspaceId,
        secretKey: existing.key,
        action: 'DELETE',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete secret error:', error);
    return NextResponse.json(
      { error: 'Failed to delete secret' },
      { status: 500 }
    );
  }
}
