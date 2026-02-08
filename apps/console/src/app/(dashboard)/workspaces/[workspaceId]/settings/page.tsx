'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Guardrail {
  dailyTokenCap: number;
  dailyCostCapCents: number;
  perRunTokenCap: number;
  perRunCostCapCents: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  guardrail: Guardrail | null;
}

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function parseTokenInput(value: string): number {
  const cleaned = value.replace(/[^\d.KMkm]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (cleaned.toLowerCase().includes('m')) return num * 1000000;
  if (cleaned.toLowerCase().includes('k')) return num * 1000;
  return num;
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [dailyTokenCap, setDailyTokenCap] = useState('');
  const [dailyCostCap, setDailyCostCap] = useState('');
  const [perRunTokenCap, setPerRunTokenCap] = useState('');
  const [perRunCostCap, setPerRunCostCap] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  async function fetchWorkspace() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch workspace');
      const data = await res.json();
      setWorkspace(data);
      setName(data.name);
      if (data.guardrail) {
        setDailyTokenCap(formatTokens(data.guardrail.dailyTokenCap));
        setDailyCostCap((data.guardrail.dailyCostCapCents / 100).toFixed(2));
        setPerRunTokenCap(formatTokens(data.guardrail.perRunTokenCap));
        setPerRunCostCap((data.guardrail.perRunCostCapCents / 100).toFixed(2));
      } else {
        setDailyTokenCap('250K');
        setDailyCostCap('10.00');
        setPerRunTokenCap('200K');
        setPerRunCostCap('5.00');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          guardrails: {
            dailyTokenCap: parseTokenInput(dailyTokenCap),
            dailyCostCapCents: Math.round(parseFloat(dailyCostCap) * 100),
            perRunTokenCap: parseTokenInput(perRunTokenCap),
            perRunCostCapCents: Math.round(parseFloat(perRunCostCap) * 100),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      fetchWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete workspace');
      }

      router.push('/workspaces');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6 flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mt-6">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">Workspace not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-6">Workspace Settings</h2>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">General</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Workspace Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                type="text"
                defaultValue={workspace.slug}
                className="w-full px-3 py-2 rounded-md border bg-muted text-muted-foreground"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used in URLs and API endpoints. Cannot be changed.
              </p>
            </div>
          </div>
        </div>

        {/* Guardrails */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">Guardrails</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set limits to control token usage and costs. Use K for thousands, M for millions.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dailyTokenCap" className="block text-sm font-medium mb-2">
                Daily Token Cap
              </label>
              <input
                id="dailyTokenCap"
                type="text"
                value={dailyTokenCap}
                onChange={(e) => setDailyTokenCap(e.target.value)}
                placeholder="250K"
                className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="dailyCostCap" className="block text-sm font-medium mb-2">
                Daily Cost Cap ($)
              </label>
              <input
                id="dailyCostCap"
                type="text"
                value={dailyCostCap}
                onChange={(e) => setDailyCostCap(e.target.value)}
                placeholder="10.00"
                className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="perRunTokenCap" className="block text-sm font-medium mb-2">
                Per-Run Token Cap
              </label>
              <input
                id="perRunTokenCap"
                type="text"
                value={perRunTokenCap}
                onChange={(e) => setPerRunTokenCap(e.target.value)}
                placeholder="200K"
                className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="perRunCostCap" className="block text-sm font-medium mb-2">
                Per-Run Cost Cap ($)
              </label>
              <input
                id="perRunCostCap"
                type="text"
                value={perRunCostCap}
                onChange={(e) => setPerRunCostCap(e.target.value)}
                placeholder="5.00"
                className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="py-2 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="mt-6 rounded-lg border border-destructive/50 bg-card p-6">
        <h3 className="font-medium text-destructive mb-4">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this workspace and all its playbooks and runs.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? 'Deleting...' : 'Delete Workspace'}
        </button>
      </div>
    </div>
  );
}
