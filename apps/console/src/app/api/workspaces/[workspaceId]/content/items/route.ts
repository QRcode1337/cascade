import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";

const createItemSchema = z.object({
  planId: z.string().optional().nullable(),
  channel: z.string().min(1).max(80),
  objective: z.string().min(1).max(280),
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
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await context.params;
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const items = await prisma.contentItem.findMany({
      where: { workspaceId },
      include: {
        plan: true,
        approvals: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ publishDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get content items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content items" },
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
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const payload = createItemSchema.parse(await request.json());

    if (payload.planId) {
      const plan = await prisma.contentPlan.findFirst({
        where: { id: payload.planId, workspaceId },
      });
      if (!plan) {
        return NextResponse.json(
          { error: "Content plan not found in workspace" },
          { status: 400 },
        );
      }
    }

    const item = await prisma.contentItem.create({
      data: {
        workspaceId,
        planId: payload.planId,
        channel: payload.channel,
        objective: payload.objective,
        cta: payload.cta,
        assetUrl: payload.assetUrl,
        caption: payload.caption,
        publishDate: payload.publishDate ? new Date(payload.publishDate) : null,
        status: payload.status,
        createdBy: payload.createdBy,
        approvedBy: payload.approvedBy,
        approvedAt: payload.approvedAt ? new Date(payload.approvedAt) : null,
      },
      include: {
        approvals: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create content item error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create content item" },
      { status: 500 },
    );
  }
}
