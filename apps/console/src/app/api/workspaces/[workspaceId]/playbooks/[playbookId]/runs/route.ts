import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";
import { enqueueExecuteRun } from "@/lib/queue";

const createRunSchema = z.object({
  input: z.record(z.unknown()).optional(),
});

interface RouteContext {
  params: Promise<{ workspaceId: string; playbookId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, playbookId } = await context.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const runs = await prisma.run.findMany({
      where: {
        workspaceId,
        playbookVer: { playbookId },
      },
      include: {
        playbookVer: true,
        _count: { select: { steps: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Get runs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, playbookId } = await context.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!playbook || playbook.versions.length === 0) {
      return NextResponse.json(
        { error: "Playbook not found or has no versions" },
        { status: 404 },
      );
    }

    const latestVersion = playbook.versions[0]!;

    const body = await request.json().catch(() => ({}));
    const { input } = createRunSchema.parse(body);

    const run = await prisma.run.create({
      data: {
        workspaceId,
        playbookVerId: latestVersion.id,
        status: "PENDING",
        input: (input || {}) as object,
      },
      include: {
        playbookVer: true,
      },
    });

    const queued = await enqueueExecuteRun({
      runId: run.id,
      workspaceId,
      playbookVersionId: latestVersion.id,
    });

    if (!queued) {
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: "Unable to enqueue run for execution",
          finishedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "Failed to enqueue run" },
        { status: 500 },
      );
    }

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("Create run error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 },
    );
  }
}
