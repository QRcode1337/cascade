import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { formatDate, formatDuration, formatTokens, formatCost } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface RunDetailPageProps {
  params: Promise<{ workspaceId: string; runId: string }>;
}

interface StepOutput {
  type?: string;
  status?: string;
  content?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costCents?: number;
  generatedAt?: string;
  note?: string;
  fallback?: boolean;
}

async function getRun(runId: string) {
  return prisma.run.findUnique({
    where: { id: runId },
    include: {
      playbookVer: {
        include: {
          playbook: true,
        },
      },
      steps: {
        orderBy: { idx: 'asc' },
      },
    },
  });
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  RUNNING: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  SUCCEEDED: 'bg-green-500/10 text-green-600 border-green-500/20',
  FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
  CANCELED: 'bg-muted text-muted-foreground border-border',
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { workspaceId, runId } = await params;
  const run = await getRun(runId);

  if (!run || run.playbookVer.playbook.workspaceId !== workspaceId) {
    notFound();
  }

  const playbook = run.playbookVer.playbook;
  const durationMs = run.finishedAt && run.startedAt
    ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
    : null;
  const totalTokens = run.tokensIn + run.tokensOut;

  return (
    <div className="mt-6">
      <div className="mb-6">
        <Link
          href={`/workspaces/${workspaceId}/runs`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Runs
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Run Details</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {run.id}
          </p>
        </div>
        <span
          className={cn('px-4 py-2 rounded-lg border', statusStyles[run.status])}
        >
          {run.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Input */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Input</h2>
            <div className="bg-muted rounded-md p-4">
              <pre className="text-sm overflow-auto max-h-48">
                {JSON.stringify(run.input, null, 2)}
              </pre>
            </div>
          </div>

          {/* Output */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Output</h2>
            {run.output ? (
              <div className="bg-muted rounded-md p-4">
                <pre className="text-sm overflow-auto max-h-48">
                  {JSON.stringify(run.output, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {run.status === 'RUNNING'
                  ? 'Waiting for output...'
                  : 'No output available.'}
              </p>
            )}
          </div>

          {/* Execution Steps - Generated Content */}
          {run.steps && run.steps.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-lg">Generated Outputs ({run.steps.length})</h2>
              {run.steps.map((step, idx) => {
                const output = step.output as StepOutput | null;
                const hasContent = output?.content && output.content.length > 0;

                return (
                  <div key={step.id} className="rounded-lg border bg-card overflow-hidden">
                    {/* Step Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="font-medium">{step.name}</h3>
                          {output?.type && (
                            <p className="text-xs text-muted-foreground">{output.type}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {output?.model && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {output.model}
                          </span>
                        )}
                        {(output?.tokensIn || output?.tokensOut) && (
                          <span className="text-xs text-muted-foreground">
                            {formatTokens((output.tokensIn || 0) + (output.tokensOut || 0))} tokens
                          </span>
                        )}
                        {output?.costCents && output.costCents > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {formatCost(output.costCents)}
                          </span>
                        )}
                        <span
                          className={cn('text-xs px-2 py-1 rounded-full', statusStyles[step.status])}
                        >
                          {step.status}
                        </span>
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="p-4">
                      {hasContent ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {output.content}
                          </div>
                        </div>
                      ) : output?.note ? (
                        <p className="text-sm text-muted-foreground italic">{output.note}</p>
                      ) : step.status === 'RUNNING' ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating...
                        </div>
                      ) : step.status === 'PENDING' ? (
                        <p className="text-sm text-muted-foreground">Waiting to execute...</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No content generated.</p>
                      )}
                    </div>

                    {/* Error indicator */}
                    {output?.fallback && (
                      <div className="px-4 pb-4">
                        <div className="text-xs text-amber-600 bg-amber-500/10 px-3 py-2 rounded">
                          Generation failed - showing error message
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {run.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
              <h2 className="font-semibold mb-4 text-red-600">Error</h2>
              <div className="bg-red-500/10 rounded-md p-4">
                <pre className="text-sm overflow-auto max-h-48 text-red-600">
                  {run.error}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Metadata</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Playbook</dt>
                <dd className="font-medium mt-1">
                  <Link
                    href={`/workspaces/${workspaceId}/playbooks/${playbook.id}`}
                    className="hover:underline"
                  >
                    {playbook.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-medium mt-1">v{run.playbookVer.version}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Started</dt>
                <dd className="font-medium mt-1">
                  {run.startedAt ? formatDate(run.startedAt) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Finished</dt>
                <dd className="font-medium mt-1">
                  {run.finishedAt ? formatDate(run.finishedAt) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium mt-1">
                  {durationMs ? formatDuration(durationMs) : run.status === 'RUNNING' ? 'In progress...' : '—'}
                </dd>
              </div>
              {totalTokens > 0 && (
                <div>
                  <dt className="text-muted-foreground">Tokens</dt>
                  <dd className="font-medium mt-1">{formatTokens(totalTokens)}</dd>
                </div>
              )}
              {run.costCents > 0 && (
                <div>
                  <dt className="text-muted-foreground">Cost</dt>
                  <dd className="font-medium mt-1">{formatCost(run.costCents)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/workspaces/${workspaceId}/playbooks/${playbook.id}`}
                className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
              >
                View Playbook
              </Link>
              <Link
                href={`/workspaces/${workspaceId}/playbooks/${playbook.id}/runs`}
                className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
              >
                All Playbook Runs
              </Link>
              <Link
                href={`/workspaces/${workspaceId}/runs`}
                className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
              >
                All Workspace Runs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
