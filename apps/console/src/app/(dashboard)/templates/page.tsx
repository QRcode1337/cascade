import Link from "next/link";
import { prisma } from "@cascade/db";
import { SeedButton } from "../agents/seed-button";

export const metadata = { title: "Templates" };

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  agents: string[];
}

async function getTemplates(): Promise<Template[]> {
  try {
    const templates = await prisma.$queryRaw<Template[]>`
      SELECT id, slug, name, description, category, agents
      FROM "PlaybookTemplate"
      ORDER BY category, name ASC
    `;
    return templates;
  } catch {
    return [];
  }
}

const categoryColors: Record<string, string> = {
  audit: "bg-blue-500/10 text-blue-600",
  outreach: "bg-green-500/10 text-green-600",
  marketing: "bg-purple-500/10 text-purple-600",
  sales: "bg-orange-500/10 text-orange-600",
  demo: "bg-pink-500/10 text-pink-600",
  automation: "bg-cyan-500/10 text-cyan-600",
  setup: "bg-yellow-500/10 text-yellow-600",
  strategy: "bg-red-500/10 text-red-600",
  content: "bg-indigo-500/10 text-indigo-600",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();
  const needsSeeding = templates.length === 0;

  // Group by category
  const byCategory = templates.reduce(
    (acc, template) => {
      if (!acc[template.category]) acc[template.category] = [];
      acc[template.category]!.push(template);
      return acc;
    },
    {} as Record<string, Template[]>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Playbook Templates</h1>
          <p className="text-muted-foreground mt-1">
            Pre-built templates from the CASCADE playbook library -{" "}
            {templates.length} templates
          </p>
        </div>
        {needsSeeding && <SeedButton />}
      </div>

      {needsSeeding ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No templates loaded</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Click "Seed Agents" on the Agents page to load templates from the
            playbook library
          </p>
          <Link href="/agents" className="text-primary hover:underline">
            Go to Agents
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-4 capitalize">
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/templates/${template.slug}`}
                    className="rounded-lg border bg-card p-5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">{template.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category] || "bg-muted text-muted-foreground"}`}
                      >
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.agents.slice(0, 3).map((agent) => (
                        <span
                          key={agent}
                          className="text-xs px-2 py-0.5 rounded bg-muted"
                        >
                          {agent}
                        </span>
                      ))}
                      {template.agents.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          +{template.agents.length - 3}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Template Categories</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${color.replace("text-", "bg-").split(" ")[0]}`}
              />
              <span className="text-sm capitalize">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
