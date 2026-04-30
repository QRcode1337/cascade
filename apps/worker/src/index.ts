import PgBoss from 'pg-boss';
import pino from 'pino';
import { prisma } from '@cascade/db';
import { executeRun } from './handlers/execute-run.js';
import { startScheduler } from './schedulers/schedule-triggers.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

async function main() {
  logger.info('Starting CASCADE worker...');

  // Initialize pg-boss with direct connection (needs LISTEN/NOTIFY)
  const boss = new PgBoss({
    connectionString: process.env.PGBOSS_DATABASE_URL || process.env.DIRECT_DATABASE_URL,
    schema: 'pgboss',
    retryLimit: 3,
    retryBackoff: true,
    archiveCompletedAfterSeconds: 86400, // 24 hours
    deleteAfterDays: 7,
  });

  boss.on('error', (error) => logger.error({ error }, 'pg-boss error'));

  await boss.start();
  logger.info('pg-boss started');

  // Register job handler with batch processing
  await boss.work(
    'execute-run',
    { batchSize: CONCURRENCY },
    async (jobs) => {
      for (const job of jobs) {
        const data = job.data as { runId: string };
        const { runId } = data;
        logger.info({ runId, jobId: job.id }, 'Processing run');

        try {
          await executeRun(runId, logger);
          logger.info({ runId }, 'Run completed successfully');
        } catch (error) {
          logger.error({ runId, error }, 'Run failed');
          throw error; // Re-throw to trigger pg-boss retry
        }
      }
    }
  );

  logger.info({ concurrency: CONCURRENCY }, 'Worker ready, listening for jobs');

  const schedulerTimer = startScheduler(boss, logger);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    clearInterval(schedulerTimer);
    await boss.stop({ graceful: true, timeout: 30000 });
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.fatal({ error }, 'Worker failed to start');
  process.exit(1);
});
