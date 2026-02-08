import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';
import { WorkspaceNav } from './workspace-nav';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  const session = await getSession();

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: session!.user.id,
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/workspaces" className="hover:text-foreground">
            Workspaces
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{workspace.name}</span>
        </div>
        <WorkspaceNav workspaceId={workspaceId} />
      </div>
      {children}
    </div>
  );
}
