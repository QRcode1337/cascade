/**
 * Agent type definitions for CASCADE Console
 */

export interface Agent {
  id: string;
  slug: string;
  name: string;
  mission: string;
  systemPrompt: string | null;
  playbooks: string[];
  outputs: string[];
  lane: string | null;
}

export interface AgentListItem {
  id: string;
  slug: string;
  name: string;
  mission: string;
  playbooks: string[];
  outputs: string[];
  lane: string | null;
}
