import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";

const createPlanSchema = z.object({
  title: z.string().min(1).max(120),
  month: z.string().datetime(),
  channel: z.string().min(1).max(80),
  objective: z.string().max(280).optional().nullable(),
  targetPosts: z.number().int().min(1).max(31).default(12),
  notes: z.string().max(5000).optional().nullable(),
  status: z.enum(["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"]).optional(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

async function requireWorkspace(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({ where: { id: workspaceId, userId } });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await context.params;
    const workspace = await requireWorkspace(workspaceId, session.user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const plans = await prisma.contentPlan.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Get content plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content plans" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await context.params;
    const workspace = await requireWorkspace(workspaceId, session.user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const body = await request.json();
    const payload = createPlanSchema.parse(body);

    const plan = await prisma.contentPlan.create({
      data: {
        workspaceId,
        title: payload.title,
        month: new Date(payload.month),
        channel: payload.channel,
        objective: payload.objective,
        targetPosts: payload.targetPosts,
        notes: payload.notes,
        status: payload.status,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Create content plan error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create content plan" },
      { status: 500 },
    );
  }
}
