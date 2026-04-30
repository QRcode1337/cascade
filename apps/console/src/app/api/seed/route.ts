import { NextResponse } from "next/server";
import { Prisma, prisma } from "@cascade/db";

// Agent definitions from AGENTS.md
const AGENTS = [
  {
    slug: "orchestrator",
    name: "OrchestratorAgent",
    mission:
      "Run the CASCADE program end-to-end: pick lane, assign agents, track deliverables, and ship outcomes on schedule.",
    systemPrompt:
      "You are the CASCADE Orchestrator. Optimize for shipped deliverables and scheduled demos. If something is ambiguous, choose the lowest-risk default and proceed.",
    playbooks: [
      "todo.md",
      "10-quick-start-checklist.md",
      "04-proposal-template.md",
    ],
    outputs: [
      "14-day execution plan",
      "Daily outreach + demo quotas",
      "Milestone checklist per client",
    ],
    lane: null,
  },
  {
    slug: "strategy",
    name: "StrategyAgent",
    mission:
      'Decide the best lane, offer, and positioning for a given business. Translate "AI" into a concrete business outcome.',
    systemPrompt: null,
    playbooks: [
      "03-landing-page-copy.md",
      "01-audit-methodology.md",
      "11-no-site-outreachpack.md",
      "12-lane-2-strat-guide.txt",
    ],
    outputs: [
      "Lane selection + hook",
      "Top 3 automations + ROI estimate",
      "Discovery questions for audit call",
    ],
    lane: null,
  },
  {
    slug: "leadgen",
    name: "LeadGenAgent",
    mission:
      "Build and enrich lead lists (name, phone, email, website, issues) and hand clean rows to OutreachAgent.",
    systemPrompt: null,
    playbooks: [
      "cascade_prospects_50_contacts_template.csv",
      "cascade_prospects_50.csv",
    ],
    outputs: [
      "Enriched spreadsheet rows",
      "Digital gap signal notes",
      "Suggested lane per prospect",
    ],
    lane: null,
  },
  {
    slug: "dataops",
    name: "DataOpsAgent",
    mission:
      "Keep the pipeline clean: normalize spreadsheets, dedupe rows, manage statuses, and prep imports into CRMs.",
    systemPrompt: null,
    playbooks: ["cascade_prospects_50_contacts_template.csv"],
    outputs: [
      "Clean CSVs ready for upload",
      "Tracker columns",
      "Simple reporting",
    ],
    lane: null,
  },
  {
    slug: "outreach",
    name: "OutreachAgent",
    mission:
      "Generate personalized outreach that gets replies without sounding like a malfunctioning sales robot.",
    systemPrompt: null,
    playbooks: [
      "02-outreach-email-templates.md",
      "11-no-site-outreachpack.md",
      "13-high-impact-outreach-scripts.txt",
      "09-email-sms-templates.md",
      "12-lane-2-strat-guide.txt",
    ],
    outputs: [
      "3-touch email sequence per lane",
      "Phone script + voicemail script",
      "Permission-to-text message",
      "Subject line variants",
    ],
    lane: null,
  },
  {
    slug: "audit",
    name: "AuditAgent",
    mission:
      "Run the 90-120 minute audit, surface 3-5 high-impact automations, and structure them into a deliverable that sells implementation.",
    systemPrompt: null,
    playbooks: [
      "01-audit-methodology.md",
      "06-demo-setup-guide.md",
      "10-quick-start-checklist.md",
    ],
    outputs: ["Current state map", "Opportunity backlog", "Quick demo plan"],
    lane: null,
  },
  {
    slug: "automation-architect",
    name: "AutomationArchitectAgent",
    mission:
      "Turn opportunities into concrete system designs (modules, triggers, data schema, messages) that can be implemented quickly.",
    systemPrompt: null,
    playbooks: [
      "08-make-automation-blueprints.md",
      "07-typebot-flow-templates.json",
      "09-email-sms-templates.md",
      "10-quick-start-checklist.md",
    ],
    outputs: [
      "Architecture diagram",
      "Make.com scenario specs",
      "Typebot flow selection",
      "Operational templates",
    ],
    lane: null,
  },
  {
    slug: "demo-builder",
    name: "DemoBuilderAgent",
    mission:
      "Build the live demo assets that close deals: working bot, booking, notifications, follow-ups.",
    systemPrompt: null,
    playbooks: [
      "06-demo-setup-guide.md",
      "10-quick-start-checklist.md",
      "07-typebot-flow-templates.json",
      "08-make-automation-blueprints.md",
    ],
    outputs: ["Demo link + how-to script", "Screenshot pack", "Demo checklist"],
    lane: null,
  },
  {
    slug: "proposal",
    name: "ProposalAgent",
    mission:
      "Convert audit outputs into a paid engagement with clean scope, timeline, and pricing.",
    systemPrompt: null,
    playbooks: [
      "04-proposal-template.md",
      "01-audit-methodology.md",
      "03-landing-page-copy.md",
    ],
    outputs: ["Completed proposal", "Pricing options", "Next steps email"],
    lane: null,
  },
  {
    slug: "security",
    name: "SecurityAgent",
    mission:
      "Add the security/risk lens that differentiates EPSILON: data minimization, access control, logging, and safer AI usage.",
    systemPrompt: null,
    playbooks: [],
    outputs: [
      "Risk register",
      "Minimum Secure Setup checklist",
      "Bi-monthly security check offer",
    ],
    lane: null,
  },
  {
    slug: "case-study",
    name: "CaseStudyAgent",
    mission: "Turn delivered work into proof that sells the next client.",
    systemPrompt: null,
    playbooks: ["05-case-study-framework.md", "03-landing-page-copy.md"],
    outputs: ["1-page case study", "Full case study", "Proof assets checklist"],
    lane: null,
  },
  {
    slug: "landing-page",
    name: "LandingPageAgent",
    mission:
      "Maintain a landing page that converts and doesn't read like a crypto scam.",
    systemPrompt: null,
    playbooks: ["03-landing-page-copy.md", "05-case-study-framework.md"],
    outputs: ["Updated sections", "CTA variants", "Industry-specific variants"],
    lane: null,
  },
  {
    slug: "console-engineer",
    name: "ConsoleEngineerAgent",
    mission:
      "Implement the multi-agent console (Next.js/TS) that orchestrates agents, stores playbooks, and generates deliverables.",
    systemPrompt: null,
    playbooks: [],
    outputs: [
      "Repo structure",
      "Agent registry loader",
      "Playbook store",
      "Execution runs",
    ],
    lane: null,
  },
];

// Playbook template definitions
const TEMPLATES = [
  {
    slug: "audit-methodology",
    name: "Audit Methodology",
    category: "audit",
    agents: ["audit", "strategy", "proposal"],
    file: "01-audit-methodology.md",
  },
  {
    slug: "outreach-email-templates",
    name: "Outreach Email Templates",
    category: "outreach",
    agents: ["outreach"],
    file: "02-outreach-email-templates.md",
  },
  {
    slug: "landing-page-copy",
    name: "Landing Page Copy",
    category: "marketing",
    agents: ["landing-page", "strategy"],
    file: "03-landing-page-copy.md",
  },
  {
    slug: "proposal-template",
    name: "Proposal Template",
    category: "sales",
    agents: ["proposal", "orchestrator"],
    file: "04-proposal-template.md",
  },
  {
    slug: "case-study-framework",
    name: "Case Study Framework",
    category: "marketing",
    agents: ["case-study"],
    file: "05-case-study-framework.md",
  },
  {
    slug: "demo-setup-guide",
    name: "Demo Setup Guide",
    category: "demo",
    agents: ["demo-builder", "audit"],
    file: "06-demo-setup-guide.md",
  },
  {
    slug: "typebot-flow-templates",
    name: "Typebot Flow Templates",
    category: "automation",
    agents: ["automation-architect", "demo-builder"],
    file: "07-typebot-flow-templates.json",
  },
  {
    slug: "make-automation-blueprints",
    name: "Make Automation Blueprints",
    category: "automation",
    agents: ["automation-architect"],
    file: "08-make-automation-blueprints.md",
  },
  {
    slug: "email-sms-templates",
    name: "Email/SMS Templates",
    category: "outreach",
    agents: ["automation-architect", "outreach"],
    file: "09-email-sms-templates.md",
  },
  {
    slug: "quick-start-checklist",
    name: "Quick Start Checklist",
    category: "setup",
    agents: ["demo-builder", "orchestrator"],
    file: "10-quick-start-checklist.md",
  },
  {
    slug: "no-site-outreach-pack",
    name: "No-Site Outreach Pack",
    category: "outreach",
    agents: ["outreach", "strategy"],
    file: "11-no-site-outreachpack.md",
  },
  {
    slug: "lane-2-strategy-guide",
    name: "Lane 2 Strategy Guide",
    category: "strategy",
    agents: ["strategy", "outreach"],
    file: "12-lane-2-strat-guide.txt",
  },
  {
    slug: "high-impact-outreach-scripts",
    name: "High-Impact Outreach Scripts",
    category: "outreach",
    agents: ["outreach"],
    file: "13-high-impact-outreach-scripts.txt",
  },
  {
    slug: "social-content-pipeline",
    name: "Social Content Pipeline",
    category: "content",
    agents: ["strategy", "outreach", "orchestrator"],
    file: "14-social-content-pipeline.md",
  },
];

export async function POST() {
  try {
    // Seed agents
    for (const agent of AGENTS) {
      await prisma.agent.upsert({
        where: { slug: agent.slug },
        create: {
          slug: agent.slug,
          name: agent.name,
          mission: agent.mission,
          systemPrompt: agent.systemPrompt,
          playbooks: agent.playbooks,
          outputs: agent.outputs,
          lane: agent.lane,
        },
        update: {
          name: agent.name,
          mission: agent.mission,
          systemPrompt: agent.systemPrompt,
          playbooks: agent.playbooks,
          outputs: agent.outputs,
          lane: agent.lane,
        },
      });
    }

    // Seed templates (without content for now - just metadata)
    for (const template of TEMPLATES) {
      await prisma.playbookTemplate.upsert({
        where: { slug: template.slug },
        create: {
          slug: template.slug,
          name: template.name,
          description: `Template from ${template.file}`,
          content: `See ${template.file} for content`,
          category: template.category,
          agents: template.agents,
        },
        update: {
          name: template.name,
          description: `Template from ${template.file}`,
          category: template.category,
          agents: template.agents,
        },
      });
    }

    return NextResponse.json({
      success: true,
      agents: AGENTS.length,
      templates: TEMPLATES.length,
    });
  } catch (error) {
    console.error("Seed error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json(
        { error: "Database schema is out of date. Run `pnpm db:migrate` and retry." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to seed agents and templates",
  });
}
