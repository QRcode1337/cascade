import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";

const updateItemSchema = z.object({
  planId: z.string().optional().nullable(),
  channel: z.string().min(1).max(80).optional(),
  objective: z.string().min(1).max(280).optional(),
  cta: z.string().max(240).optional().nullable(),
  assetUrl: z.string().url().optional().nullable(),
  caption: z.string().max(5000).optional().nullable(),
  publishDate: z.string().datetime().optional().nullable(),
  status: z.enum(["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"]).optional(),
  createdBy: z.string().max(120).optional().nullable(),
  approvedBy: z.string().max(120).optional().nullable(),
  approvedAt: z.string().datetime().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string; itemId: string }>;
}

async function authorize(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({ where: { id: workspaceId, userId } });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, itemId } = await context.params;
    const workspace = await authorize(workspaceId, session.user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const existing = await prisma.contentItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 },
      );

    const payload = updateItemSchema.parse(await request.json());

    if (payload.planId) {
      const plan = await prisma.contentPlan.findFirst({
        where: { id: payload.planId, workspaceId },
      });
      if (!plan)
        return NextResponse.json(
          { error: "Content plan not found in workspace" },
          { status: 400 },
        );
    }

    const item = await prisma.contentItem.update({
      where: { id: itemId },
      data: {
        planId: payload.planId,
        channel: payload.channel,
        objective: payload.objective,
        cta: payload.cta,
        assetUrl: payload.assetUrl,
        caption: payload.caption,
        publishDate: payload.publishDate
          ? new Date(payload.publishDate)
          : payload.publishDate === null
            ? null
            : undefined,
        status: payload.status,
        createdBy: payload.createdBy,
        approvedBy: payload.approvedBy,
        approvedAt: payload.approvedAt
          ? new Date(payload.approvedAt)
          : payload.approvedAt === null
            ? null
            : undefined,
      },
      include: {
        approvals: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update content item error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update content item" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, itemId } = await context.params;
    const workspace = await authorize(workspaceId, session.user.id);
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const existing = await prisma.contentItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 },
      );

    await prisma.contentItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete content item error:", error);
    return NextResponse.json(
      { error: "Failed to delete content item" },
      { status: 500 },
    );
  }
}
