import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@cascade/db';
import { formatDate } from '@/lib/utils';

interface TemplateDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface PlaybookTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string;
  category: string;
  agents: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Agent {
  slug: string;
  name: string;
  mission: string;
  lane: string | null;
}

async function getTemplate(slug: string): Promise<PlaybookTemplate | null> {
  try {
    const templates = await prisma.$queryRaw<PlaybookTemplate[]>`
      SELECT id, slug, name, description, content, category, agents, "createdAt", "updatedAt"
      FROM "PlaybookTemplate"
      WHERE slug = ${slug}
      LIMIT 1
    `;
    return templates[0] || null;
  } catch {
    return null;
  }
}

async function getRelatedAgents(agentSlugs: string[]): Promise<Agent[]> {
  if (agentSlugs.length === 0) return [];
  try {
    const agents = await prisma.$queryRaw<Agent[]>`
      SELECT slug, name, mission, lane
      FROM "Agent"
      WHERE slug = ANY(${agentSlugs})
      ORDER BY name ASC
    `;
    return agents;
  } catch {
    return [];
  }
}

const categoryColors: Record<string, string> = {
  audit: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  outreach: 'bg-green-500/10 text-green-600 border-green-500/20',
  marketing: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  sales: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  demo: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  automation: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  setup: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  strategy: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export async function generateMetadata({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) return { title: 'Template Not Found' };
  return { title: template.name };
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const template = await getTemplate(slug);

  if (!template) {
    notFound();
  }

  const relatedAgents = await getRelatedAgents(template.agents);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/templates"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Templates
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {template.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {template.description}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1.5 rounded-full border text-sm ${
            categoryColors[template.category] || 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {template.category}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Template Content */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Template Content</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="bg-muted rounded-md p-4 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[600px]">
                {template.content}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Details</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium mt-1 capitalize">{template.category}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-medium mt-1 font-mono text-xs">{template.slug}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium mt-1">{formatDate(template.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="font-medium mt-1">{formatDate(template.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Related Agents */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Related Agents ({relatedAgents.length})</h2>
            {relatedAgents.length > 0 ? (
              <div className="space-y-3">
                {relatedAgents.map((agent) => (
                  <Link
                    key={agent.slug}
                    href={`/agents/${agent.slug}`}
                    className="block p-3 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{agent.name}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {agent.mission}
                    </p>
                    {agent.lane && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted">
                        {agent.lane}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agents linked to this template.</p>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Link
                href="/templates"
                className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
              >
                Browse Templates
              </Link>
              <Link
                href="/agents"
                className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
              >
                View All Agents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
