import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";

const createApprovalSchema = z.object({
  reviewer: z.string().min(1).max(120),
  status: z.enum(["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"]),
  feedback: z.string().max(5000).optional().nullable(),
  approvedAt: z.string().datetime().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string; itemId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, itemId } = await context.params;
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const item = await prisma.contentItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!item)
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 },
      );

    const approvals = await prisma.contentApproval.findMany({
      where: { workspaceId, contentItemId: itemId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Get approvals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, itemId } = await context.params;
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });
    if (!workspace)
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );

    const item = await prisma.contentItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!item)
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 },
      );

    const payload = createApprovalSchema.parse(await request.json());

    const approval = await prisma.$transaction(async (tx: any) => {
      const created = await tx.contentApproval.create({
        data: {
          workspaceId,
          contentItemId: itemId,
          reviewer: payload.reviewer,
          status: payload.status,
          feedback: payload.feedback,
          approvedAt: payload.approvedAt ? new Date(payload.approvedAt) : null,
        },
      });

      await tx.contentItem.update({
        where: { id: itemId },
        data: {
          status: payload.status,
          approvedBy:
            payload.status === "APPROVED" ? payload.reviewer : item.approvedBy,
          approvedAt:
            payload.status === "APPROVED"
              ? payload.approvedAt
                ? new Date(payload.approvedAt)
                : new Date()
              : item.approvedAt,
        },
      });

      return created;
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Create approval error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create approval record" },
      { status: 500 },
    );
  }
}
