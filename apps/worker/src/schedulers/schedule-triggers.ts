import PgBoss from 'pg-boss';
import type { Logger } from 'pino';
import { prisma } from '@cascade/db';

function matchesCron(expr: string, date: Date): boolean {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const [minuteF, hourF, domF, monthF, dowF] = fields;

  function matchField(field: string, value: number, min: number, max: number): boolean {
    if (field === '*') return true;
    for (const part of field.split(',')) {
      if (part.includes('/')) {
        const [range, stepStr] = part.split('/');
        const step = parseInt(stepStr, 10);
        if (isNaN(step)) return false;
        let start = min, end = max;
        if (range !== '*') {
          const [s, e] = range.split('-').map(Number);
          start = s; end = e ?? s;
        }
        for (let v = start; v <= end; v += step) {
          if (v === value) return true;
        }
        continue;
      }
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number);
        if (value >= s && value <= e) return true;
        continue;
      }
      if (parseInt(part, 10) === value) return true;
    }
    return false;
  }

  return (
    matchField(minuteF, date.getUTCMinutes(), 0, 59) &&
    matchField(hourF, date.getUTCHours(), 0, 23) &&
    matchField(domF, date.getUTCDate(), 1, 31) &&
    matchField(monthF, date.getUTCMonth() + 1, 1, 12) &&
    matchField(dowF, date.getUTCDay(), 0, 6)
  );
}

async function fireDueTriggers(boss: PgBoss, logger: Logger): Promise<void> {
  const now = new Date();
  const triggers = await prisma.trigger.findMany({
    where: { type: 'SCHEDULE', enabled: true },
    include: {
      playbook: {
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      },
    },
  });

  for (const trigger of triggers) {
    const config = trigger.config as Record<string, unknown>;
    const cronExpr = config['cron'] as string | undefined;
    if (!cronExpr) {
      logger.warn({ triggerId: trigger.id }, 'SCHEDULE trigger has no cron expression, skipping');
      continue;
    }
    if (!matchesCron(cronExpr, now)) continue;

    const latestVersion = trigger.playbook.versions[0];
    if (!latestVersion) {
      logger.warn({ triggerId: trigger.id }, 'SCHEDULE trigger has no playbook version, skipping');
      continue;
    }

    try {
      const run = await prisma.run.create({
        data: {
          workspaceId: trigger.workspaceId,
          playbookVerId: latestVersion.id,
          triggerId: trigger.id,
          status: 'PENDING',
          input: { triggeredBy: 'schedule', cron: cronExpr } as object,
        },
      });

      await boss.send(
        'execute-run',
        { runId: run.id, workspaceId: trigger.workspaceId, playbookVersionId: latestVersion.id },
        { singletonKey: `run:${run.id}`, expireInSeconds: 300 }
      );

      await prisma.trigger.update({
        where: { id: trigger.id },
        data: { lastFired: now },
      });

      logger.info({ triggerId: trigger.id, runId: run.id, cron: cronExpr }, 'Schedule trigger fired');
    } catch (error) {
      logger.error({ triggerId: trigger.id, error }, 'Failed to fire schedule trigger');
    }
  }
}

export function startScheduler(boss: PgBoss, logger: Logger): NodeJS.Timeout {
  logger.info('Schedule trigger scheduler started (interval: 60s)');
  fireDueTriggers(boss, logger).catch((err) => {
    logger.error({ error: err }, 'Initial schedule trigger check failed');
  });
  return setInterval(() => {
    fireDueTriggers(boss, logger).catch((err) => {
      logger.error({ error: err }, 'Schedule trigger check failed');
    });
  }, 60_000);
}
