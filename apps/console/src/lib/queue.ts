import PgBoss from "pg-boss";

const EXECUTE_RUN_JOB = "execute-run";

export interface ExecuteRunPayload {
  runId: string;
  workspaceId: string;
  playbookVersionId: string;
}

let bossPromise: Promise<PgBoss> | null = null;

async function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    bossPromise = createBoss();
  }
  return bossPromise;
}

async function createBoss(): Promise<PgBoss> {
  const connectionString =
    process.env.PGBOSS_DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    throw new Error("PGBOSS_DATABASE_URL or DIRECT_DATABASE_URL is required");
  }

  const boss = new PgBoss({
    connectionString,
    schema: "pgboss",
    retryLimit: 3,
    retryBackoff: true,
    archiveCompletedAfterSeconds: 60 * 60 * 24,
  });

  boss.on("error", (error) => {
    console.error("pg-boss error:", error);
  });

  await boss.start();
  return boss;
}

export async function enqueueExecuteRun(
  payload: ExecuteRunPayload,
): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(EXECUTE_RUN_JOB, payload, {
    singletonKey: `run:${payload.runId}`,
    expireInSeconds: 300,
  });
}
