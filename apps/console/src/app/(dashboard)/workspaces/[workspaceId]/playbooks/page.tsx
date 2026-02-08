import Link from 'next/link';
import { prisma } from '@cascade/db';
import { formatDate } from '@/lib/utils';

interface PlaybooksPageProps {
  params: Promise<{ workspaceId: string }>;
}

export const metadata = { title: 'Playbooks' };

async function getPlaybooks(workspaceId: string) {
  return prisma.playbook.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { versions: true, triggers: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export default async function PlaybooksPage({ params }: PlaybooksPageProps) {
  const { workspaceId } = await params;

  const playbooks = await getPlaybooks(workspaceId);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Playbooks</h2>
        <Link
          href={`/workspaces/${workspaceId}/playbooks/new`}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          New Playbook
        </Link>
      </div>

      {playbooks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No playbooks yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first playbook to define AI workflows.
          </p>
          <Link
            href={`/workspaces/${workspaceId}/playbooks/new`}
            className="inline-flex px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create Playbook
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {playbooks.map((playbook) => (
            <Link
              key={playbook.id}
              href={`/workspaces/${workspaceId}/playbooks/${playbook.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <h3 className="font-medium">{playbook.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>v{playbook.versions[0]?.version || 0}</span>
                  <span>{playbook._count.versions} versions</span>
                  <span>Updated {formatDate(playbook.updatedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {playbook.currentId ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                    Draft
                  </span>
                )}
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
