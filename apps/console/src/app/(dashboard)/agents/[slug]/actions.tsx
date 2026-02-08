'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AgentActionsProps {
  agentSlug: string;
  agentName: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface TaskPacket {
  client_or_prospect: {
    name: string;
    industry: string;
    location: string;
    website: string;
    goal: string;
  };
  lane: 'lane1' | 'lane2' | 'lane3' | 'unknown';
  constraints: {
    budget: string;
    tools: string;
    compliance: string;
  };
  artifacts: {
    notes: string;
    links: string;
  };
}

const initialTaskPacket: TaskPacket = {
  client_or_prospect: {
    name: '',
    industry: '',
    location: '',
    website: '',
    goal: '',
  },
  lane: 'unknown',
  constraints: {
    budget: '',
    tools: '',
    compliance: '',
  },
  artifacts: {
    notes: '',
    links: '',
  },
};

export function AgentActions({ agentSlug, agentName }: AgentActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskPacket, setTaskPacket] = useState<TaskPacket>(initialTaskPacket);
  const router = useRouter();

  useEffect(() => {
    if (showModal) {
      fetch('/api/workspaces')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setWorkspaces(data);
          if (data.length > 0 && !selectedWorkspace) {
            setSelectedWorkspace(data[0].id);
          }
        })
        .catch(() => setWorkspaces([]));
    }
  }, [showModal]);

  function updateClientField(field: keyof TaskPacket['client_or_prospect'], value: string) {
    setTaskPacket(prev => ({
      ...prev,
      client_or_prospect: { ...prev.client_or_prospect, [field]: value },
    }));
  }

  function updateConstraintsField(field: keyof TaskPacket['constraints'], value: string) {
    setTaskPacket(prev => ({
      ...prev,
      constraints: { ...prev.constraints, [field]: value },
    }));
  }

  function updateArtifactsField(field: keyof TaskPacket['artifacts'], value: string) {
    setTaskPacket(prev => ({
      ...prev,
      artifacts: { ...prev.artifacts, [field]: value },
    }));
  }

  async function handleRun() {
    if (!selectedWorkspace) {
      setError('Please select a workspace');
      return;
    }

    if (!taskPacket.client_or_prospect.name) {
      setError('Please enter a client/prospect name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a playbook from this agent
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/playbooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${agentName} - ${taskPacket.client_or_prospect.name}`,
          description: `${agentName} run for ${taskPacket.client_or_prospect.name} (${taskPacket.client_or_prospect.industry})`,
          agentSlug,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create playbook');
      }

      const playbook = await res.json();

      // Create a run for the playbook with the task packet as input
      const runRes = await fetch(`/api/workspaces/${selectedWorkspace}/playbooks/${playbook.id}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: taskPacket }),
      });

      if (!runRes.ok) {
        // Navigate to playbook anyway
        router.push(`/workspaces/${selectedWorkspace}/playbooks/${playbook.id}`);
        return;
      }

      const run = await runRes.json();
      router.push(`/workspaces/${selectedWorkspace}/runs/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setTaskPacket(initialTaskPacket);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors"
      >
        Run Agent
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4">
              <h2 className="text-lg font-semibold">Run {agentName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in the task packet to configure this agent run.
              </p>
            </div>

            <div className="p-4 space-y-6">
              {/* Workspace Selection */}
              {workspaces.length === 0 ? (
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  No workspaces found. Create a workspace first.
                </div>
              ) : (
                <div>
                  <label htmlFor="workspace" className="block text-sm font-medium mb-2">
                    Workspace *
                  </label>
                  <select
                    id="workspace"
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Client/Prospect Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Client / Prospect</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="client-name" className="block text-xs font-medium mb-1">
                      Name *
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      value={taskPacket.client_or_prospect.name}
                      onChange={(e) => updateClientField('name', e.target.value)}
                      placeholder="Business name"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-industry" className="block text-xs font-medium mb-1">
                      Industry
                    </label>
                    <input
                      id="client-industry"
                      type="text"
                      value={taskPacket.client_or_prospect.industry}
                      onChange={(e) => updateClientField('industry', e.target.value)}
                      placeholder="e.g., Restaurant, Retail, Healthcare"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-location" className="block text-xs font-medium mb-1">
                      Location
                    </label>
                    <input
                      id="client-location"
                      type="text"
                      value={taskPacket.client_or_prospect.location}
                      onChange={(e) => updateClientField('location', e.target.value)}
                      placeholder="City, State"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-website" className="block text-xs font-medium mb-1">
                      Website
                    </label>
                    <input
                      id="client-website"
                      type="url"
                      value={taskPacket.client_or_prospect.website}
                      onChange={(e) => updateClientField('website', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="client-goal" className="block text-xs font-medium mb-1">
                    Goal
                  </label>
                  <textarea
                    id="client-goal"
                    value={taskPacket.client_or_prospect.goal}
                    onChange={(e) => updateClientField('goal', e.target.value)}
                    placeholder="What does the client want to achieve?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Lane Selection */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-2">Lane</h3>
                <div className="flex flex-wrap gap-2">
                  {(['lane1', 'lane2', 'lane3', 'unknown'] as const).map((lane) => (
                    <button
                      key={lane}
                      type="button"
                      onClick={() => setTaskPacket(prev => ({ ...prev, lane }))}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        taskPacket.lane === lane
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {lane === 'unknown' ? 'Unknown' : lane.replace('lane', 'Lane ')}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lane 1: Quick wins | Lane 2: Mid-tier | Lane 3: Enterprise | Unknown: Let agent decide
                </p>
              </div>

              {/* Constraints Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Constraints</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="constraint-budget" className="block text-xs font-medium mb-1">
                      Budget
                    </label>
                    <input
                      id="constraint-budget"
                      type="text"
                      value={taskPacket.constraints.budget}
                      onChange={(e) => updateConstraintsField('budget', e.target.value)}
                      placeholder="e.g., $500/mo"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="constraint-tools" className="block text-xs font-medium mb-1">
                      Tools
                    </label>
                    <input
                      id="constraint-tools"
                      type="text"
                      value={taskPacket.constraints.tools}
                      onChange={(e) => updateConstraintsField('tools', e.target.value)}
                      placeholder="e.g., Typebot, Make"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="constraint-compliance" className="block text-xs font-medium mb-1">
                      Compliance
                    </label>
                    <input
                      id="constraint-compliance"
                      type="text"
                      value={taskPacket.constraints.compliance}
                      onChange={(e) => updateConstraintsField('compliance', e.target.value)}
                      placeholder="e.g., HIPAA, GDPR"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Artifacts Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Artifacts</h3>
                <div>
                  <label htmlFor="artifacts-notes" className="block text-xs font-medium mb-1">
                    Notes
                  </label>
                  <textarea
                    id="artifacts-notes"
                    value={taskPacket.artifacts.notes}
                    onChange={(e) => updateArtifactsField('notes', e.target.value)}
                    placeholder="Any additional notes or context..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="artifacts-links" className="block text-xs font-medium mb-1">
                    Links
                  </label>
                  <input
                    id="artifacts-links"
                    type="text"
                    value={taskPacket.artifacts.links}
                    onChange={(e) => updateArtifactsField('links', e.target.value)}
                    placeholder="Reference URLs (comma-separated)"
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background border-t p-4 flex gap-3">
              <button
                onClick={handleRun}
                disabled={isLoading || workspaces.length === 0}
                className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Starting Run...' : 'Start Run'}
              </button>
              <button
                onClick={resetForm}
                type="button"
                className="py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="py-2 px-4 rounded-md border font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
