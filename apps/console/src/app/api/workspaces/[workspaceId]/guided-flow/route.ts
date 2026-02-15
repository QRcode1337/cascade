import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@cascade/db";
import { getSession } from "@/lib/auth";
import { generateAgentOutput } from "@/lib/openai";

const guidedFlowSchema = z.object({
  businessProfile: z.object({
    name: z.string().min(1, "Business name is required").max(120),
    industry: z.string().min(1, "Industry is required").max(120),
    location: z.string().min(1, "Location is required").max(180),
    website: z.string().max(240).optional(),
    summary: z.string().min(1, "Business summary is required").max(1500),
  }),
  lane: z.enum(["lane1", "lane2", "lane3"]),
  channels: z
    .array(z.string().min(1))
    .min(1, "Select at least one channel")
    .max(8),
  monthlyGoals: z.object({
    leads: z.coerce.number().int().min(0).max(100000),
    appointments: z.coerce.number().int().min(0).max(100000),
    revenue: z.coerce.number().int().min(0).max(100000000),
    notes: z.string().max(1000).optional(),
  }),
  selectedPackageId: z.enum(["makeover", "retainer"]),
});

const PACKAGE_PRESETS = {
  makeover: {
    id: "makeover",
    name: "One-Time Makeover",
    term: "8-week sprint",
    upfrontPrice: "$6,500",
    monthlyPrice: "$0/mo after delivery",
    deliverables: [
      "Positioning + messaging refresh",
      "Funnel + automations setup",
      "Launch support + team handoff",
    ],
  },
  retainer: {
    id: "retainer",
    name: "Monthly Retainer",
    term: "3-month minimum",
    upfrontPrice: "$1,500 onboarding",
    monthlyPrice: "$2,400/mo",
    deliverables: [
      "Continuous optimization",
      "Weekly reporting + experiments",
      "On-demand campaign execution",
    ],
  },
} as const;

const LANE_LABELS: Record<string, string> = {
  lane1: "Lane 1 - No website (Digital Receptionist)",
  lane2: "Lane 2 - Outdated site (Digital Employee)",
  lane3: "Lane 3 - Restaurants (Reputation Engine)",
};

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

function renderProposalTemplate(
  template: string,
  replacements: Record<string, string>,
) {
  return Object.entries(replacements).reduce(
    (output, [key, value]) => output.replaceAll(`{{${key}}}`, value),
    template,
  );
}

async function getProposalTemplateContent() {
  const template = await prisma.playbookTemplate.findUnique({
    where: { slug: "proposal-template" },
  });

  return template?.content?.trim()
    ? template.content
    : `# Proposal for {{businessName}}\n\n## Engagement\n- Lane: {{laneLabel}}\n- Primary channels: {{channels}}\n- Package: {{packageName}} ({{packageTerm}})\n\n## 30-Day Plan\n{{thirtyDayPlan}}\n\n## Recommended Playbook\n{{recommendedPlaybook}}\n\n## Monthly Goals\n- Leads: {{goalLeads}}\n- Appointments: {{goalAppointments}}\n- Revenue: {{goalRevenue}}\n\n## Investment\n- Upfront: {{packageUpfront}}\n- Recurring: {{packageMonthly}}\n\n## Proposal Draft\n{{proposalDraft}}\n`;
}

export async function POST(request: Request, context: RouteContext) {
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

    const payload = guidedFlowSchema.parse(await request.json());
    const packagePreset = PACKAGE_PRESETS[payload.selectedPackageId];
    const laneLabel = LANE_LABELS[payload.lane] ?? payload.lane;

    const generationContext = {
      clientInfo: {
        ...payload.businessProfile,
        lane: payload.lane,
        channels: payload.channels,
      },
      constraints: {
        packagePreset,
        monthlyGoals: payload.monthlyGoals,
      },
    };

    const [recommendedPlaybook, thirtyDayPlan, proposalDraft] =
      await Promise.all([
        generateAgentOutput(
          "StrategyAgent",
          "Recommend the best service lane and implementation playbook for local businesses.",
          "Return concise markdown with clear rationale and execution checkpoints.",
          "Recommended lane playbook",
          generationContext,
        ),
        generateAgentOutput(
          "ExecutionAgent",
          "Build practical, day-by-day action plans that can be launched quickly.",
          "Break work down into weekly milestones and include ownership + success metrics.",
          "30-day implementation plan",
          generationContext,
        ),
        generateAgentOutput(
          "ProposalAgent",
          "Draft persuasive sales proposals that align scope, outcomes, and package terms.",
          "Use sales-ready markdown and include a compelling call-to-action.",
          "Proposal draft",
          generationContext,
        ),
      ]);

    const playbookName = `${payload.businessProfile.name} - Guided ${laneLabel.split(" - ")[0]}`;
    const totalTokensIn =
      recommendedPlaybook.tokensIn +
      thirtyDayPlan.tokensIn +
      proposalDraft.tokensIn;
    const totalTokensOut =
      recommendedPlaybook.tokensOut +
      thirtyDayPlan.tokensOut +
      proposalDraft.tokensOut;
    const totalCostCents =
      recommendedPlaybook.costCents +
      thirtyDayPlan.costCents +
      proposalDraft.costCents;

    const savedPlaybook = await prisma.playbook.create({
      data: {
        workspaceId,
        name: playbookName,
        description: `Guided flow output for ${payload.businessProfile.name}.`,
        lane: payload.lane,
        versions: {
          create: {
            version: 1,
            definition: {
              source: "guided-flow",
              lane: payload.lane,
              channels: payload.channels,
              package: packagePreset,
              monthlyGoals: payload.monthlyGoals,
              businessProfile: payload.businessProfile,
              artifacts: {
                recommendedPlaybook: recommendedPlaybook.content,
                thirtyDayPlan: thirtyDayPlan.content,
                proposalDraft: proposalDraft.content,
              },
              outputs: [
                "recommended_lane_playbook",
                "30_day_plan",
                "proposal_draft",
              ],
            } as object,
          },
        },
      },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    const playbookVersionId = savedPlaybook.versions[0]?.id;
    if (!playbookVersionId) {
      return NextResponse.json(
        { error: "Failed to create playbook version" },
        { status: 500 },
      );
    }

    const proposalTemplate = await getProposalTemplateContent();
    const renderedProposal = renderProposalTemplate(proposalTemplate, {
      businessName: payload.businessProfile.name,
      laneLabel,
      channels: payload.channels.join(", "),
      packageName: packagePreset.name,
      packageTerm: packagePreset.term,
      packageUpfront: packagePreset.upfrontPrice,
      packageMonthly: packagePreset.monthlyPrice,
      goalLeads: payload.monthlyGoals.leads.toLocaleString(),
      goalAppointments: payload.monthlyGoals.appointments.toLocaleString(),
      goalRevenue: payload.monthlyGoals.revenue.toLocaleString(),
      recommendedPlaybook: recommendedPlaybook.content,
      thirtyDayPlan: thirtyDayPlan.content,
      proposalDraft: proposalDraft.content,
    });

    const run = await prisma.run.create({
      data: {
        workspaceId,
        playbookVerId: playbookVersionId,
        status: "SUCCEEDED",
        input: {
          source: "guided-flow",
          businessProfile: payload.businessProfile,
          lane: payload.lane,
          channels: payload.channels,
          monthlyGoals: payload.monthlyGoals,
          selectedPackage: packagePreset,
        } as object,
        output: {
          source: "guided-flow",
          recommendedPlaybook: recommendedPlaybook.content,
          thirtyDayPlan: thirtyDayPlan.content,
          proposalDraft: proposalDraft.content,
          renderedProposal,
          packageOptions: Object.values(PACKAGE_PRESETS),
          selectedPackage: packagePreset,
        } as object,
        tags: ["guided-flow", payload.lane, packagePreset.id],
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        costCents: totalCostCents,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        playbookId: savedPlaybook.id,
        playbookVersionId,
        runId: run.id,
        artifacts: {
          recommendedPlaybook: recommendedPlaybook.content,
          thirtyDayPlan: thirtyDayPlan.content,
          proposalDraft: proposalDraft.content,
          renderedProposal,
        },
        selectedPackage: packagePreset,
        packageOptions: Object.values(PACKAGE_PRESETS),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Guided flow submit error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to process guided flow" },
      { status: 500 },
    );
  }
}
