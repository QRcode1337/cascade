import { notFound } from "next/navigation";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

interface WorkspaceContentPageProps {
  params: Promise<{ workspaceId: string }>;
}

const goals = [12, 16, 20];

export default async function WorkspaceContentPage({
  params,
}: WorkspaceContentPageProps) {
  const session = await getSession();
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: session!.user.id },
  });

  if (!workspace) {
    notFound();
  }

  const [plans, items, statusCounts] = await Promise.all([
    prisma.contentPlan.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.contentItem.findMany({
      where: { workspaceId },
      include: {
        approvals: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ publishDate: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.contentItem.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: { _all: true },
    }),
  ]);

  const statusMap = statusCounts.reduce<Record<string, number>>(
    (
      acc: Record<string, number>,
      row: { status: string; _count: { _all: number } },
    ) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Content Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Monthly batch planning and approvals for your retainer workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"].map((status) => (
          <div key={status} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{status}</p>
            <p className="text-2xl font-semibold mt-1">
              {statusMap[status] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Monthly batch targets</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plan 12-20 posts per month by channel and objective.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {goals.map((goal) => (
            <span
              key={goal}
              className="rounded-full bg-muted px-3 py-1 text-sm"
            >
              {goal} posts
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Content plans</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No plans yet. Create one using the content API.
            </p>
          ) : (
            <div className="space-y-3">
              {plans.map(
                (plan: {
                  id: string;
                  title: string;
                  channel: string;
                  targetPosts: number;
                  month: Date;
                  status: string;
                  objective: string | null;
                  _count: { items: number };
                }) => (
                  <div key={plan.id} className="rounded border p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.channel} · {plan.targetPosts} posts ·{" "}
                          {formatDate(plan.month)}
                        </p>
                      </div>
                      <span className="text-xs rounded bg-muted px-2 py-1 h-fit">
                        {plan.status}
                      </span>
                    </div>
                    {plan.objective && (
                      <p className="text-sm mt-2">
                        Objective: {plan.objective}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {plan._count.items} content items linked
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Upcoming content items</h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content items yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {items.map(
                (item: {
                  id: string;
                  objective: string;
                  status: string;
                  channel: string;
                  cta: string | null;
                  publishDate: Date | null;
                  assetUrl: string | null;
                  approvals: Array<{ status: string; reviewer: string }>;
                }) => (
                  <div key={item.id} className="rounded border p-3">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{item.objective}</p>
                      <span className="text-xs rounded bg-muted px-2 py-1 h-fit">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.channel} · CTA: {item.cta || "N/A"} · Publish:{" "}
                      {item.publishDate ? formatDate(item.publishDate) : "TBD"}
                    </p>
                    {item.assetUrl && (
                      <a
                        href={item.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        View asset URL
                      </a>
                    )}
                    {item.approvals[0] && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last approval: {item.approvals[0].status} by{" "}
                        {item.approvals[0].reviewer}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
