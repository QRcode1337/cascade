import Link from "next/link";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Workspaces" };

export default async function WorkspacesPage() {
  const session = await getSession();

  let workspaces;

  try {
    workspaces = await prisma.workspace.findMany({
      where: { userId: session!.user.id },
      include: {
        _count: { select: { playbooks: true, runs: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.warn("Database error, falling back to mock data:", error);
    workspaces = [
      {
        id: "mock-1",
        name: "Demo Workspace",
        slug: "demo-workspace",
        userId: session!.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { playbooks: 5, runs: 12 },
      },
      {
        id: "mock-2",
        name: "Another Project",
        slug: "another-project",
        userId: session!.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { playbooks: 2, runs: 0 },
      },
    ];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your AI workflow environments
          </p>
        </div>
        <Link
          href="/workspaces/new"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          New Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first workspace to start building AI playbooks.
          </p>
          <Link
            href="/workspaces/new"
            className="inline-flex px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create Workspace
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="group rounded-lg border bg-card p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {workspace.name?.[0]?.toUpperCase() || "W"}
                </div>
                <span className="text-xs text-muted-foreground">
                  {workspace.slug}
                </span>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {workspace.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{workspace._count.playbooks} playbooks</span>
                <span>{workspace._count.runs} runs</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Updated {formatDate(workspace.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
