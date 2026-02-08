'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Trigger {
  id: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

interface Playbook {
  id: string;
  name: string;
  triggers: Trigger[];
}

const TRIGGER_TYPES = [
  { value: 'SCHEDULE', label: 'Schedule', description: 'Run on a schedule (cron)' },
  { value: 'WEBHOOK', label: 'Webhook', description: 'Run when a webhook is called' },
  { value: 'MANUAL', label: 'Manual', description: 'Run manually from the UI' },
];

const CRON_PRESETS = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every day at 9 AM', cron: '0 9 * * *' },
  { label: 'Every day at midnight', cron: '0 0 * * *' },
  { label: 'Every Monday at 9 AM', cron: '0 9 * * 1' },
  { label: 'Every weekday at 9 AM', cron: '0 9 * * 1-5' },
  { label: 'First day of month at 9 AM', cron: '0 9 1 * *' },
  { label: 'Custom...', cron: '' },
];

function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression';

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Check for presets first
  const preset = CRON_PRESETS.find(p => p.cron === cron);
  if (preset && preset.cron) return preset.label;

  // Simple pattern matching for common cases
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every minute';
  }
  if (minute?.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Every ${minute.substring(2)} minutes`;
  }
  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every hour';
  }
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour}:00`;
  }
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek && dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (/^\d$/.test(dayOfWeek)) {
      return `Every ${days[parseInt(dayOfWeek)]} at ${hour}:00`;
    }
    if (dayOfWeek === '1-5') {
      return `Every weekday at ${hour}:00`;
    }
  }
  if (minute === '0' && hour !== '*' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
    return `First of each month at ${hour}:00`;
  }

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

function getWebhookUrl(workspaceId: string, playbookId: string, triggerId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/api/webhooks/${workspaceId}/${playbookId}/${triggerId}`;
}

export default function TriggersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const playbookId = params.playbookId as string;

  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTriggerType, setNewTriggerType] = useState('SCHEDULE');

  // Schedule config
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [selectedPreset, setSelectedPreset] = useState('Every day at 9 AM');
  const [isCustomCron, setIsCustomCron] = useState(false);

  // Webhook config
  const [webhookSecret, setWebhookSecret] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPlaybook = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}`);
      if (res.ok) {
        const data = await res.json();
        setPlaybook(data);
      }
    } catch {
      setError('Failed to load playbook');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, playbookId]);

  useEffect(() => {
    fetchPlaybook();
  }, [fetchPlaybook]);

  function handlePresetChange(presetLabel: string) {
    setSelectedPreset(presetLabel);
    const preset = CRON_PRESETS.find(p => p.label === presetLabel);
    if (preset) {
      if (presetLabel === 'Custom...') {
        setIsCustomCron(true);
      } else {
        setIsCustomCron(false);
        setCronExpression(preset.cron);
      }
    }
  }

  async function handleCreateTrigger(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      let config: Record<string, unknown> = {};

      if (newTriggerType === 'SCHEDULE') {
        config = { cron: cronExpression };
      } else if (newTriggerType === 'WEBHOOK') {
        config = { secret: webhookSecret || undefined };
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newTriggerType, config }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setCronExpression('0 9 * * *');
        setSelectedPreset('Every day at 9 AM');
        setIsCustomCron(false);
        setWebhookSecret('');
        fetchPlaybook();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create trigger');
      }
    } catch {
      setError('Failed to create trigger');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleTrigger(triggerId: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}/triggers/${triggerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (res.ok) {
        fetchPlaybook();
      }
    } catch {
      setError('Failed to update trigger');
    }
  }

  async function handleDeleteTrigger(triggerId: string) {
    if (!confirm('Are you sure you want to delete this trigger?')) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}/triggers/${triggerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPlaybook();
      }
    } catch {
      setError('Failed to delete trigger');
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }

  function renderTriggerConfig(trigger: Trigger) {
    if (trigger.type === 'SCHEDULE' && trigger.config.cron) {
      return (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Schedule:</span>
            <code className="px-2 py-0.5 bg-muted rounded font-mono text-xs">
              {trigger.config.cron as string}
            </code>
          </div>
          <div className="text-xs text-muted-foreground">
            {describeCron(trigger.config.cron as string)}
          </div>
        </div>
      );
    }

    if (trigger.type === 'WEBHOOK') {
      const webhookUrl = getWebhookUrl(workspaceId, playbookId, trigger.id);
      return (
        <div className="mt-2 space-y-2">
          <div className="text-sm text-muted-foreground">Webhook URL:</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-xs break-all">
              {webhookUrl}
            </code>
            <button
              onClick={() => copyToClipboard(webhookUrl, trigger.id)}
              className="py-2 px-3 text-sm rounded-md border font-medium hover:bg-muted transition-colors flex-shrink-0"
            >
              {copiedId === trigger.id ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            Send a POST request to this URL to trigger the playbook.
            {trigger.config.secret ? ' Include the secret in the X-Webhook-Secret header.' : ''}
          </div>
        </div>
      );
    }

    if (trigger.type === 'MANUAL') {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          Run this playbook manually from the playbook page.
        </div>
      );
    }

    return null;
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
      <div className="mb-6">
        <Link
          href={`/workspaces/${workspaceId}/playbooks/${playbookId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to {playbook?.name || 'Playbook'}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Triggers</h1>
          <p className="text-muted-foreground mt-1">
            Configure when this playbook should run automatically.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Add Trigger
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Create Trigger</h2>
          <form onSubmit={handleCreateTrigger} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-2">
                Trigger Type
              </label>
              <select
                id="type"
                value={newTriggerType}
                onChange={(e) => setNewTriggerType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TRIGGER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Configuration */}
            {newTriggerType === 'SCHEDULE' && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <label htmlFor="preset" className="block text-sm font-medium mb-2">
                    Schedule Preset
                  </label>
                  <select
                    id="preset"
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CRON_PRESETS.map((preset) => (
                      <option key={preset.label} value={preset.label}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isCustomCron && (
                  <div>
                    <label htmlFor="cron" className="block text-sm font-medium mb-2">
                      Cron Expression
                    </label>
                    <input
                      id="cron"
                      type="text"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      placeholder="* * * * *"
                      className="w-full px-3 py-2 rounded-md border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: minute hour day-of-month month day-of-week
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-md bg-background border">
                  <div className="text-sm font-medium mb-1">Preview</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{cronExpression}</code>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-sm text-muted-foreground">{describeCron(cronExpression)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Cron Expression Guide:</p>
                  <div className="grid grid-cols-5 gap-2 font-mono">
                    <span>Min</span>
                    <span>Hour</span>
                    <span>Day</span>
                    <span>Month</span>
                    <span>Week</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 font-mono text-foreground">
                    <span>0-59</span>
                    <span>0-23</span>
                    <span>1-31</span>
                    <span>1-12</span>
                    <span>0-6</span>
                  </div>
                  <p className="mt-2">
                    * = any value, */n = every n, 1-5 = range, 1,3,5 = specific values
                  </p>
                </div>
              </div>
            )}

            {/* Webhook Configuration */}
            {newTriggerType === 'WEBHOOK' && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <label htmlFor="secret" className="block text-sm font-medium mb-2">
                    Webhook Secret (optional)
                  </label>
                  <input
                    id="secret"
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Enter a secret for authentication"
                    className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If set, requests must include this value in the X-Webhook-Secret header.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  The webhook URL will be displayed after creation.
                </div>
              </div>
            )}

            {/* Manual Configuration */}
            {newTriggerType === 'MANUAL' && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  A manual trigger allows you to run this playbook from the UI.
                  No additional configuration is needed.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Trigger'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTriggerType('SCHEDULE');
                  setCronExpression('0 9 * * *');
                  setSelectedPreset('Every day at 9 AM');
                  setIsCustomCron(false);
                  setWebhookSecret('');
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
        {playbook?.triggers && playbook.triggers.length > 0 ? (
          <div className="divide-y">
            {playbook.triggers.map((trigger) => (
              <div key={trigger.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {trigger.type === 'SCHEDULE' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {trigger.type === 'WEBHOOK' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                      {trigger.type === 'MANUAL' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{trigger.type}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        trigger.enabled
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {trigger.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTrigger(trigger.id, !trigger.enabled)}
                      className="py-1 px-3 text-sm rounded-md border font-medium hover:bg-muted transition-colors"
                    >
                      {trigger.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(trigger.id)}
                      className="py-1 px-3 text-sm rounded-md border border-destructive/30 text-destructive font-medium hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {renderTriggerConfig(trigger)}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p>No triggers configured.</p>
            <p className="text-sm mt-1">
              Add a trigger to run this playbook automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
