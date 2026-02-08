'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Secret {
  id: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default function SecretsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSecrets();
  }, [workspaceId]);

  async function fetchSecrets() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/secrets`);
      if (res.ok) {
        const data = await res.json();
        setSecrets(data);
      }
    } catch {
      setError('Failed to load secrets');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setNewKey('');
        setNewValue('');
        fetchSecrets();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create secret');
      }
    } catch {
      setError('Failed to create secret');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(secretId: string) {
    setIsUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/secrets/${secretId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValue }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditValue('');
        fetchSecrets();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update secret');
      }
    } catch {
      setError('Failed to update secret');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(secretId: string, secretKey: string) {
    if (!confirm(`Are you sure you want to delete ${secretKey}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/secrets/${secretId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSecrets();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete secret');
      }
    } catch {
      setError('Failed to delete secret');
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6 flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Secrets</h1>
          <p className="text-muted-foreground mt-1">
            Securely store API keys and credentials for your workflows.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Add Secret
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Create Secret</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="key" className="block text-sm font-medium mb-2">
                Secret Key
              </label>
              <input
                id="key"
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                placeholder="OPENAI_API_KEY"
                className="w-full px-3 py-2 rounded-md border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uppercase letters, numbers, and underscores only. E.g., OPENAI_API_KEY
              </p>
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium mb-2">
                Secret Value
              </label>
              <input
                id="value"
                type="password"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-md border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The value will be encrypted and stored securely.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating || !newKey || !newValue}
                className="py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Secret'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKey('');
                  setNewValue('');
                }}
                className="py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {secrets.length > 0 ? (
          <div className="divide-y">
            {secrets.map((secret) => (
              <div key={secret.id} className="p-4">
                {editingId === secret.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{secret.key}</span>
                    </div>
                    <input
                      type="password"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter new value"
                      className="w-full px-3 py-2 rounded-md border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(secret.id)}
                        disabled={isUpdating || !editValue}
                        className="py-1 px-3 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditValue('');
                        }}
                        className="py-1 px-3 text-sm rounded-md border font-medium hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{secret.key}</span>
                        <span className="text-sm text-muted-foreground">•••••••••</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {formatDate(secret.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(secret.id);
                          setEditValue('');
                        }}
                        className="py-1 px-3 text-sm rounded-md border font-medium hover:bg-muted transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(secret.id, secret.key)}
                        className="py-1 px-3 text-sm rounded-md border border-destructive/30 text-destructive font-medium hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p>No secrets configured.</p>
            <p className="text-sm mt-1">
              Add API keys and credentials to use in your workflows.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Using Secrets in Workflows</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Access secrets in your workflow definitions using the format:
        </p>
        <div className="bg-muted rounded-md p-4">
          <code className="text-sm font-mono">{'{{secrets.OPENAI_API_KEY}}'}</code>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Secrets are encrypted at rest and only decrypted during workflow execution.
          They are never exposed in logs or API responses.
        </p>
      </div>
    </div>
  );
}
