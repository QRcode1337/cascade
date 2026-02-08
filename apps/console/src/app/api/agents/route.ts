import { NextResponse } from 'next/server';
import { prisma } from '@cascade/db';

interface Agent {
  id: string;
  slug: string;
  name: string;
  mission: string;
  playbooks: string[];
  outputs: string[];
  lane: string | null;
}

export async function GET() {
  try {
    const agents = await prisma.$queryRaw<Agent[]>`
      SELECT id, slug, name, mission, playbooks, outputs, lane
      FROM "Agent"
      ORDER BY name ASC
    `;
    return NextResponse.json(agents);
  } catch (error) {
    // Table might not exist yet
    console.error('Get agents error:', error);
    return NextResponse.json([]);
  }
}
