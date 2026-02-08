import PgBoss from 'pg-boss';

export const JOB_TYPES = {
  EXECUTE_RUN: 'execute-run',
  CLEANUP_EXPIRED: 'cleanup-expired',
} as const;

export interface ExecuteRunPayload {
  runId: string;
  workspaceId: string;
  playbookVersionId: string;
}

export async function createBoss(): Promise<PgBoss> {
  const connectionString = process.env.PGBOSS_DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    throw new Error('PGBOSS_DATABASE_URL or DIRECT_DATABASE_URL is required');
  }

  const boss = new PgBoss({
    connectionString,
    schema: 'pgboss',
    retryLimit: 3,
    retryDelay: 5,
    retryBackoff: true,
    monitorStateIntervalSeconds: 30,
    archiveCompletedAfterSeconds: 60 * 60 * 24,
  });

  boss.on('error', (error) => {
    console.error('pg-boss error:', error);
  });

  await boss.start();
  return boss;
}

export async function enqueueRun(
  boss: PgBoss,
  payload: ExecuteRunPayload
): Promise<string | null> {
  return boss.send(JOB_TYPES.EXECUTE_RUN, payload, {
    singletonKey: `run:${payload.runId}`,
    expireInSeconds: 300,
  });
}

export async function registerHandlers(
  boss: PgBoss,
  handlers: {
    executeRun: (job: PgBoss.Job<ExecuteRunPayload>) => Promise<void>;
  }
): Promise<void> {
  await boss.work<ExecuteRunPayload>(
    JOB_TYPES.EXECUTE_RUN,
    {
      teamSize: parseInt(process.env.WORKER_CONCURRENCY || '5'),
      teamConcurrency: 1,
    },
    handlers.executeRun
  );
}
