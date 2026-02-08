import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { formatDate } from '@/lib/utils';

interface RunsPageProps {
  params: Promise<{ workspaceId: string; playbookId: string }>;
}

async function getPlaybookWithRuns(workspaceId: string, playbookId: string) {
  const playbook = await prisma.playbook.findFirst({
    where: { id: playbookId, workspaceId },
    include: {
      versions: { orderBy: { version: 'desc' } },
    },
  });

  if (!playbook) return null;

  const versionIds = playbook.versions.map((v) => v.id);

  const runs = await prisma.run.findMany({
    where: { playbookVerId: { in: versionIds } },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  return { playbook, runs };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SUCCEEDED':
      return 'bg-green-500/10 text-green-600';
    case 'RUNNING':
      return 'bg-blue-500/10 text-blue-600';
    case 'FAILED':
      return 'bg-red-500/10 text-red-600';
    case 'PENDING':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'CANCELED':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default async function RunsPage({ params }: RunsPageProps) {
  const { workspaceId, playbookId } = await params;
  const result = await getPlaybookWithRuns(workspaceId, playbookId);

  if (!result) {
    notFound();
  }

  const { playbook, runs } = result;

  return (
    <div className="mt-6">
      <div className="mb-6">
        <Link
          href={`/workspaces/${workspaceId}/playbooks/${playbookId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to {playbook.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Run History</h1>
          <p className="text-muted-foreground mt-1">
            Execution history for {playbook.name}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {runs.length > 0 ? (
          <div className="divide-y">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/workspaces/${workspaceId}/playbooks/${playbookId}/runs/${run.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium font-mono text-sm">
                      {run.id.slice(0, 8)}...
                    </span>
                    {run.startedAt && (
                      <span className="text-muted-foreground text-sm ml-4">
                        Started {formatDate(run.startedAt)}
                      </span>
                    )}
                    {run.finishedAt && (
                      <span className="text-muted-foreground text-sm ml-2">
                        • Finished {formatDate(run.finishedAt)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(run.status)}`}
                  >
                    {run.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>No runs yet.</p>
            <p className="text-sm mt-1">
              Run the playbook to see execution history here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
