'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlaybookActionsProps {
  workspaceId: string;
  playbookId: string;
}

export function PlaybookActions({ workspaceId, playbookId }: PlaybookActionsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  async function handleRun() {
    setIsRunning(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/playbooks/${playbookId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const run = await res.json();
        router.push(`/workspaces/${workspaceId}/playbooks/${playbookId}/runs/${run.id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start run');
      }
    } catch {
      alert('Failed to start run');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="font-semibold mb-4">Actions</h2>
      <div className="space-y-2">
        <Link
          href={`/workspaces/${workspaceId}/playbooks/${playbookId}/edit`}
          className="block w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-center"
        >
          Edit Workflow
        </Link>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {isRunning ? 'Starting...' : 'Run Playbook'}
        </button>
        <Link
          href={`/workspaces/${workspaceId}/playbooks/${playbookId}/runs`}
          className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
        >
          View Runs
        </Link>
        <Link
          href={`/workspaces/${workspaceId}/playbooks/${playbookId}/triggers`}
          className="block w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors text-center"
        >
          Manage Triggers
        </Link>
      </div>
    </div>
  );
}
