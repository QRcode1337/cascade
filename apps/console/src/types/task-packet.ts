/**
 * TaskPacket type definitions for CASCADE agents
 *
 * TaskPacket represents the standard input format for all CASCADE agents,
 * containing client information, lane classification, constraints, and artifacts.
 */

export type Lane = 'lane1' | 'lane2' | 'lane3' | 'unknown';

export interface TaskPacket {
  client_or_prospect: {
    name: string;
    industry: string;
    location: string;
    website: string;
    goal: string;
  };
  lane: Lane;
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

export const INITIAL_TASK_PACKET: TaskPacket = {
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
} as const;

/**
 * Check if TaskPacket has any meaningful data entered
 */
export function hasTaskPacketData(taskPacket: TaskPacket): boolean {
  return !!(
    taskPacket.client_or_prospect.name ||
    taskPacket.client_or_prospect.industry ||
    taskPacket.client_or_prospect.goal ||
    taskPacket.constraints.budget ||
    taskPacket.artifacts.notes
  );
}
