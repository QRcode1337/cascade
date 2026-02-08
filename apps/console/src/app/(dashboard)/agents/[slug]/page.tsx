import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { AgentActions } from './actions';

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

interface Agent {
  id: string;
  slug: string;
  name: string;
  mission: string;
  systemPrompt: string | null;
  playbooks: string[];
  outputs: string[];
  lane: string | null;
}

async function getAgent(slug: string): Promise<Agent | null> {
  try {
    const agents = await prisma.$queryRaw<Agent[]>`
      SELECT id, slug, name, mission, "systemPrompt", playbooks, outputs, lane
      FROM "Agent"
      WHERE slug = ${slug}
      LIMIT 1
    `;
    return agents[0] || null;
  } catch {
    return null;
  }
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/agents"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Agents
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground mt-1">{agent.slug}</p>
        </div>
        {agent.lane && (
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {agent.lane}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-3">Mission</h2>
            <p className="text-muted-foreground">{agent.mission}</p>
          </div>

          {agent.systemPrompt && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-3">System Prompt</h2>
              <div className="bg-muted rounded-md p-4">
                <pre className="text-sm whitespace-pre-wrap">{agent.systemPrompt}</pre>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-3">Expected Outputs</h2>
            <ul className="space-y-2">
              {agent.outputs.map((output, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{output}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-3">Playbooks</h2>
            {agent.playbooks.length > 0 ? (
              <ul className="space-y-2">
                {agent.playbooks.map((playbook, i) => (
                  <li key={i} className="text-sm">
                    <code className="px-2 py-1 bg-muted rounded text-xs">
                      {playbook}
                    </code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No playbooks assigned</p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-3">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/agents/${agent.slug}/playground`}
                className="block w-full py-2 px-4 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-center"
              >
                Open Playground
              </Link>
              <Link
                href={`/workspaces`}
                className="block w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-center"
              >
                Create Playbook
              </Link>
              <AgentActions agentSlug={agent.slug} agentName={agent.name} />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-3">Task Packet Schema</h2>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><code>client_or_prospect</code>: name, industry, location, website, goal</p>
              <p><code>lane</code>: lane1 | lane2 | lane3 | unknown</p>
              <p><code>constraints</code>: budget, tools, compliance</p>
              <p><code>artifacts</code>: notes, links</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
