'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PlaybookVersion {
  id: string;
  version: number;
  definition: Record<string, unknown>;
}

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  versions: PlaybookVersion[];
}

export default function EditPlaybookPage() {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [definition, setDefinition] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const playbookId = params.playbookId as string;

  useEffect(() => {
    async function fetchPlaybook() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}`);
        if (!res.ok) throw new Error('Failed to fetch playbook');
        const data = await res.json();
        setPlaybook(data);
        setName(data.name);
        setDescription(data.description || '');
        const latestVersion = data.versions[0];
        setDefinition(JSON.stringify(latestVersion?.definition || {}, null, 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playbook');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaybook();
  }, [workspaceId, playbookId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate JSON
      let parsedDefinition;
      try {
        parsedDefinition = JSON.parse(definition);
      } catch {
        throw new Error('Invalid JSON in workflow definition');
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          definition: parsedDefinition,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update playbook');
      }

      router.push(`/workspaces/${workspaceId}/playbooks/${playbookId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="mt-6">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">Playbook not found</p>
          <Link href={`/workspaces/${workspaceId}/playbooks`} className="text-primary hover:underline mt-2 inline-block">
            Back to Playbooks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6">
        <Link
          href={`/workspaces/${workspaceId}/playbooks/${playbookId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Playbook
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-bold mb-6">Edit Playbook</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Playbook Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="definition" className="block text-sm font-medium mb-2">
              Workflow Definition (JSON)
            </label>
            <textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define your workflow steps, inputs, and outputs in JSON format.
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving || !name}
              className="py-2 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/workspaces/${workspaceId}/playbooks/${playbookId}`}
              className="py-2 px-6 rounded-md border font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
