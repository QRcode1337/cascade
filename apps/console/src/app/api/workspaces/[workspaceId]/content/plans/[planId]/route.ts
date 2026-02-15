import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";

const updatePlanSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  month: z.string().datetime().optional(),
  channel: z.string().min(1).max(80).optional(),
  objective: z.string().max(280).optional().nullable(),
  targetPosts: z.number().int().min(1).max(31).optional(),
  notes: z.string().max(5000).optional().nullable(),
  status: z.enum(["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"]).optional(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string; planId: string }>;
}

async function authorize(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({ where: { id: workspaceId, userId } });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, planId } = await context.params;
    const workspace = await authorize(workspaceId, session.user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const existing = await prisma.contentPlan.findFirst({
      where: { id: planId, workspaceId },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Content plan not found" },
        { status: 404 },
      );

    const body = await request.json();
    const payload = updatePlanSchema.parse(body);

    const updated = await prisma.contentPlan.update({
      where: { id: planId },
      data: {
        title: payload.title,
        month: payload.month ? new Date(payload.month) : undefined,
        channel: payload.channel,
        objective: payload.objective,
        targetPosts: payload.targetPosts,
        notes: payload.notes,
        status: payload.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update content plan error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update content plan" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, planId } = await context.params;
    const workspace = await authorize(workspaceId, session.user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const existing = await prisma.contentPlan.findFirst({
      where: { id: planId, workspaceId },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Content plan not found" },
        { status: 404 },
      );

    await prisma.contentPlan.delete({ where: { id: planId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete content plan error:", error);
    return NextResponse.json(
      { error: "Failed to delete content plan" },
      { status: 500 },
    );
  }
}
