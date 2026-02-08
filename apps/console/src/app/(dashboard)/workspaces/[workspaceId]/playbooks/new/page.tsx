'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Agent {
  slug: string;
  name: string;
}

const LANES = [
  { value: '', label: 'No specific lane' },
  { value: 'lane1', label: 'Lane 1 - No website (Digital Receptionist)' },
  { value: 'lane2', label: 'Lane 2 - Outdated site (Digital Employee)' },
  { value: 'lane3', label: 'Lane 3 - Restaurants (Reputation Engine)' },
];

export default function NewPlaybookPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentSlug, setAgentSlug] = useState('');
  const [lane, setLane] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.ok ? res.json() : [])
      .then(data => setAgents(data))
      .catch(() => setAgents([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, agentSlug: agentSlug || null, lane: lane || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create playbook');
      }

      const playbook = await res.json();
      router.push(`/workspaces/${workspaceId}/playbooks/${playbook.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg mt-6">
      <div className="mb-6">
        <Link
          href={`/workspaces/${workspaceId}/playbooks`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Playbooks
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-bold mb-2">Create Playbook</h1>
        <p className="text-muted-foreground text-sm mb-6">
          A playbook defines an AI workflow with steps, triggers, and actions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Playbook Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Playbook"
              required
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this playbook does..."
              rows={3}
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label htmlFor="agent" className="block text-sm font-medium mb-2">
              Assigned Agent
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <select
              id="agent"
              value={agentSlug}
              onChange={(e) => setAgentSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No agent assigned</option>
              {agents.map((agent) => (
                <option key={agent.slug} value={agent.slug}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lane" className="block text-sm font-medium mb-2">
              Program Lane
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <select
              id="lane"
              value={lane}
              onChange={(e) => setLane(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {LANES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !name}
              className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Playbook'}
            </button>
            <Link
              href={`/workspaces/${workspaceId}/playbooks`}
              className="py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
