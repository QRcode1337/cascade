import Link from 'next/link';
import { prisma } from '@cascade/db';
import { formatDate, formatDuration, formatTokens, formatCost } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface RunsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export const metadata = { title: 'Runs' };

const statusStyles: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  RUNNING: 'bg-blue-500/10 text-blue-600 animate-pulse',
  SUCCEEDED: 'bg-green-500/10 text-green-600',
  FAILED: 'bg-destructive/10 text-destructive',
  CANCELED: 'bg-muted text-muted-foreground',
};

export default async function RunsPage({ params }: RunsPageProps) {
  const { workspaceId } = await params;

  const runs = await prisma.run.findMany({
    where: { workspaceId },
    include: {
      playbookVer: {
        select: {
          version: true,
          playbook: { select: { name: true } }
        }
      },
      _count: { select: { steps: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Recent Runs</h2>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No runs yet</h3>
          <p className="text-muted-foreground text-sm">
            Runs will appear here when you execute playbooks.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {runs.map((run) => {
            const durationMs = run.finishedAt && run.startedAt
              ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
              : null;
            const totalTokens = run.tokensIn + run.tokensOut;

            return (
              <Link
                key={run.id}
                href={`/workspaces/${workspaceId}/runs/${run.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className={cn('px-2 py-1 text-xs rounded-full font-medium', statusStyles[run.status])}>
                    {run.status}
                  </span>
                  <div>
                    <h3 className="font-medium">{run.playbookVer.playbook.name} v{run.playbookVer.version}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{run._count.steps} steps</span>
                      {durationMs && <span>{formatDuration(durationMs)}</span>}
                      <span>{formatDate(run.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {totalTokens > 0 && <span>{formatTokens(totalTokens)} tokens</span>}
                  {run.costCents > 0 && <span>{formatCost(run.costCents)}</span>}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
