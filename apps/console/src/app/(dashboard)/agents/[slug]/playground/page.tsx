import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { PlaygroundChat } from './playground-chat';

interface PlaygroundPageProps {
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

export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/agents/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to {agent.name}
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="font-semibold">{agent.name} Playground</h1>
            <p className="text-xs text-muted-foreground">Interactive testing mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {agent.lane && (
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              {agent.lane}
            </span>
          )}
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs">
            Playground
          </span>
        </div>
      </div>

      {/* Main content */}
      <PlaygroundChat agent={agent} />
    </div>
  );
}
