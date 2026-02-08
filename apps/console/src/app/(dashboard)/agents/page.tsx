import Link from 'next/link';
import { prisma } from '@cascade/db';
import { Monitor } from 'lucide-react';
import { SeedButton } from './seed-button';
import { EmptyState } from '@/components/empty-state';
import { AgentListItem } from '@/types';
import { AgentListArraySchema } from '@/lib/validations/agent';
import { logger } from '@/lib/logger';

export const metadata = { title: 'Agents' };

async function getAgents(): Promise<AgentListItem[]> {
  try {
    const rawAgents = await prisma.$queryRaw`
      SELECT id, slug, name, mission, playbooks, outputs, lane
      FROM "Agent"
      ORDER BY name ASC
    `;

    // Validate and parse the database response
    const agents = AgentListArraySchema.parse(rawAgents);
    return agents;
  } catch (error) {
    logger.dbError('getAgents', error, {
      operation: 'fetch agents list',
      table: 'Agent'
    });
    return [];
  }
}

export default async function AgentsPage() {
  const agents = await getAgents();

  const needsSeeding = agents.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Registry</h1>
          <p className="text-muted-foreground mt-1">
            CASCADE agents from AGENTS.md - {agents.length} agents loaded
          </p>
        </div>
        {needsSeeding && (
          <SeedButton />
        )}
      </div>

      {needsSeeding ? (
        <EmptyState
          icon={<Monitor className="w-6 h-6 text-muted-foreground" />}
          title="No agents loaded"
          description="Click 'Seed Agents' to load the CASCADE agent registry from AGENTS.md"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.slug}`}
              className="rounded-lg border bg-card p-5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{agent.name}</h3>
                {agent.lane && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {agent.lane}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {agent.mission}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{agent.playbooks.length} playbooks</span>
                <span>{agent.outputs.length} outputs</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Workflow Overview</h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Lane 1:</strong> No website → "Digital Receptionist Drop"</p>
          <p><strong>Lane 2:</strong> Outdated site → "Digital Employee Overlay"</p>
          <p><strong>Lane 3:</strong> Restaurants → "Reputation & Reservation Engine"</p>
        </div>
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Default Pipeline</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>LeadGenAgent builds/enriches list</li>
            <li>OutreachAgent runs lane-appropriate sequence</li>
            <li>AuditAgent runs audit + captures opportunities</li>
            <li>DemoBuilderAgent shows working proof</li>
            <li>ProposalAgent generates client-ready proposal</li>
            <li>AutomationArchitectAgent builds implementation plan</li>
            <li>SecurityAgent performs risk review</li>
            <li>CaseStudyAgent publishes proof</li>
            <li>LandingPageAgent updates proof blocks</li>
            <li>OrchestratorAgent keeps everything moving</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
