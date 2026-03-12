import { NextResponse } from 'next/server';
import PgBoss from 'pg-boss';
import { prisma } from '@cascade/db';

interface RouteContext {
  params: Promise<{ triggerId: string }>;
}

let boss: PgBoss | null = null;

async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  const connectionString = process.env.PGBOSS_DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!connectionString) throw new Error('PGBOSS_DATABASE_URL or DIRECT_DATABASE_URL is required');

  boss = new PgBoss({
    connectionString,
    schema: 'pgboss',
    retryLimit: 3,
    retryBackoff: true,
    archiveCompletedAfterSeconds: 86400,
    deleteAfterDays: 7,
  });
  boss.on('error', (error) => console.error('pg-boss error (webhook):', error));
  await boss.start();
  return boss;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { triggerId } = await context.params;

    const trigger = await prisma.trigger.findUnique({
      where: { id: triggerId },
      include: {
        playbook: {
          include: {
            versions: { orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }
    if (trigger.type !== 'WEBHOOK') {
      return NextResponse.json({ error: 'Trigger is not a webhook trigger' }, { status: 400 });
    }
    if (!trigger.enabled) {
      return NextResponse.json({ error: 'Trigger is disabled' }, { status: 400 });
    }

    const latestVersion = trigger.playbook.versions[0];
    if (!latestVersion) {
      return NextResponse.json({ error: 'No playbook version found' }, { status: 400 });
    }

    let payload: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text) payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const run = await prisma.run.create({
      data: {
        workspaceId: trigger.workspaceId,
        playbookVerId: latestVersion.id,
        triggerId: trigger.id,
        status: 'PENDING',
        input: payload as object,
      },
    });

    const b = await getBoss();
    await b.send(
      'execute-run',
      { runId: run.id, workspaceId: trigger.workspaceId, playbookVersionId: latestVersion.id },
      { singletonKey: `run:${run.id}`, expireInSeconds: 300 }
    );

    await prisma.trigger.update({
      where: { id: trigger.id },
      data: { lastFired: new Date() },
    });

    return NextResponse.json({ runId: run.id }, { status: 202 });
  } catch (error) {
    console.error('Webhook trigger error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
