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
      include: { guardrail: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const usage = await prisma.usageLog.aggregate({
      where: {
        workspaceId,
        timestamp: { gte: startOfDay },
      },
      _sum: {
        tokensIn: true,
        tokensOut: true,
        costCents: true,
      },
    });

    const tokensIn = usage._sum.tokensIn ?? 0;
    const tokensOut = usage._sum.tokensOut ?? 0;
    const totalTokens = tokensIn + tokensOut;
    const totalCostCents = usage._sum.costCents ?? 0;

    const tokenCap = workspace.guardrail?.dailyTokenCap ?? 250000;
    const costCapCents = workspace.guardrail?.dailyCostCapCents ?? 1000;

    return NextResponse.json({
      usage: {
        tokensIn,
        tokensOut,
        totalTokens,
        totalCostCents,
      },
      caps: {
        dailyTokenCap: tokenCap,
        dailyCostCapCents: costCapCents,
      },
      utilization: {
        tokenPct:
          tokenCap > 0 ? Math.min(100, (totalTokens / tokenCap) * 100) : 0,
        costPct:
          costCapCents > 0
            ? Math.min(100, (totalCostCents / costCapCents) * 100)
            : 0,
      },
      dayStart: startOfDay.toISOString(),
    });
  } catch (error) {
    console.error("Daily usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily usage" },
      { status: 500 },
    );
  }
}
