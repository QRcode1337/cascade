import Link from 'next/link';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface Run {
  id: string;
  status: string;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  error: string | null;
  workspaceId: string;
  workspace: {
    name: string;
    slug: string;
  };
  playbookVer: {
    playbook: {
      id: string;
      name: string;
    };
  };
}

async function getRecentActivity(): Promise<Run[]> {
  const session = await getSession();
  if (!session) return [];

  // Get all runs from user's workspaces
  const runs = await prisma.run.findMany({
    where: {
      workspace: {
        userId: session.user.id,
      },
    },
    include: {
      workspace: {
        select: {
          name: true,
          slug: true,
        },
      },
      playbookVer: {
        include: {
          playbook: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return runs as unknown as Run[];
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start) return '-';
  const endTime = end || new Date();
  const ms = endTime.getTime() - start.getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatCost(cents: number): string {
  if (cents === 0) return '-';
  if (cents < 1) return `$${(cents / 100).toFixed(4)}`;
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const runs = await getRecentActivity();

  // Calculate summary stats
  const totalRuns = runs.length;
  const successfulRuns = runs.filter(r => r.status === 'SUCCEEDED').length;
  const totalCost = runs.reduce((sum, r) => sum + (r.costCents || 0), 0);
  const totalTokens = runs.reduce((sum, r) => sum + (r.tokensIn || 0) + (r.tokensOut || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground mt-1">
          Recent agent runs across all your workspaces
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Runs</p>
          <p className="text-2xl font-bold">{totalRuns}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-2xl font-bold">
            {totalRuns > 0 ? `${Math.round((successfulRuns / totalRuns) * 100)}%` : '-'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-2xl font-bold">{formatCost(totalCost)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Tokens</p>
          <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
        </div>
      </div>

      {/* Activity List */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Runs</h2>
        </div>
        {runs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No activity yet. Run an agent to see activity here.</p>
            <Link
              href="/agents"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Browse Agents
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {runs.map((run) => (
              <div key={run.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/workspaces/${run.workspaceId}/runs/${run.id}`}
                        className="font-medium hover:text-primary transition-colors truncate"
                      >
                        {run.playbookVer?.playbook?.name || 'Unnamed Playbook'}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        <Link
                          href={`/workspaces/${run.workspaceId}/playbooks`}
                          className="hover:text-foreground transition-colors"
                        >
                          {run.workspace?.name || 'Unknown Workspace'}
                        </Link>
                      </span>
                      <span>{formatRelativeTime(run.createdAt)}</span>
                      <span>Duration: {formatDuration(run.startedAt, run.finishedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {(run.tokensIn || 0) + (run.tokensOut || 0)} tokens
                    </p>
                    <p className="font-medium">{formatCost(run.costCents || 0)}</p>
                  </div>
                </div>
                {run.error && (
                  <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                    {run.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
