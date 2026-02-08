import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { formatDate } from '@/lib/utils';
import { PlaybookActions } from './actions';

interface PlaybookPageProps {
  params: Promise<{ workspaceId: string; playbookId: string }>;
}

async function getPlaybook(workspaceId: string, playbookId: string) {
  return prisma.playbook.findFirst({
    where: { id: playbookId, workspaceId },
    include: {
      versions: { orderBy: { version: 'desc' } },
      triggers: true,
      _count: { select: { versions: true, triggers: true } },
    },
  });
}

export default async function PlaybookPage({ params }: PlaybookPageProps) {
  const { workspaceId, playbookId } = await params;
  const playbook = await getPlaybook(workspaceId, playbookId);

  if (!playbook) {
    notFound();
  }

  const currentVersion = playbook.versions[0];

  return (
    <div className="mt-6">
      <div className="mb-6">
        <Link
          href={`/workspaces/${workspaceId}/playbooks`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Playbooks
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{playbook.name}</h1>
          {playbook.description && (
            <p className="text-muted-foreground mt-1">{playbook.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>v{currentVersion?.version || 0}</span>
            <span>{playbook._count.versions} versions</span>
            <span>{playbook._count.triggers} triggers</span>
            <span>Updated {formatDate(playbook.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {playbook.currentId ? (
            <span className="px-3 py-1 text-sm rounded-full bg-green-500/10 text-green-600">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 text-sm rounded-full bg-muted text-muted-foreground">
              Draft
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Workflow Definition</h2>
            {currentVersion ? (
              <div className="bg-muted rounded-md p-4">
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(currentVersion.definition, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No version created yet.</p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Version History</h2>
            {playbook.versions.length > 0 ? (
              <div className="divide-y">
                {playbook.versions.map((version) => (
                  <div key={version.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Version {version.version}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      {playbook.currentId === version.id && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No versions yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PlaybookActions workspaceId={workspaceId} playbookId={playbookId} />

          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Triggers</h2>
            {playbook.triggers.length > 0 ? (
              <div className="space-y-2">
                {playbook.triggers.map((trigger) => (
                  <div key={trigger.id} className="p-3 rounded-md bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{trigger.type}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        trigger.enabled
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                      }`}>
                        {trigger.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No triggers configured. Add a trigger to run this playbook automatically.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
