import { NextResponse } from "next/server";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const [planCount, itemCount, byStatus] = await Promise.all([
      prisma.contentPlan.count({ where: { workspaceId } }),
      prisma.contentItem.count({ where: { workspaceId } }),
      prisma.contentItem.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      plans: planCount,
      items: itemCount,
      statusCounts: byStatus.reduce<Record<string, number>>(
        (
          acc: Record<string, number>,
          row: { status: string; _count: { _all: number } },
        ) => {
          acc[row.status] = row._count._all;
          return acc;
        },
        {},
      ),
    });
  } catch (error) {
    console.error("Content dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content dashboard" },
      { status: 500 },
    );
  }
}
