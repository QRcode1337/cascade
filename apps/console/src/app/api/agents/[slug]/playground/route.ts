import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cascade/db';
import { getSession } from '@/lib/auth';
import { generateContent } from '@/lib/openai';

const playgroundSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  taskPacket: z.object({
    client_or_prospect: z.object({
      name: z.string().optional(),
      industry: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
      goal: z.string().optional(),
    }).optional(),
    lane: z.enum(['lane1', 'lane2', 'lane3', 'unknown']).optional(),
    constraints: z.object({
      budget: z.string().optional(),
      tools: z.string().optional(),
      compliance: z.string().optional(),
    }).optional(),
    artifacts: z.object({
      notes: z.string().optional(),
      links: z.string().optional(),
    }).optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

interface RouteContext {
  params: Promise<{ slug: string }>;
}

interface Agent {
  id: string;
  slug: string;
  name: string;
  mission: string;
  systemPrompt: string | null;
  playbooks: string[];
  outputs: string[];
  lane: string | null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;

    // Get the agent
    const agents = await prisma.$queryRaw<Agent[]>`
      SELECT id, slug, name, mission, "systemPrompt", playbooks, outputs, lane
      FROM "Agent"
      WHERE slug = ${slug}
      LIMIT 1
    `;

    const agent = agents[0];
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json();
    const { message, taskPacket, conversationHistory } = playgroundSchema.parse(body);

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        response: `[Playground Mode - No API Key]\n\nI am ${agent.name}.\n\nMission: ${agent.mission}\n\nYour message: "${message}"\n\nTo get real AI responses, set the OPENAI_API_KEY environment variable.`,
        tokensIn: 0,
        tokensOut: 0,
        costCents: 0,
        model: 'placeholder',
      });
    }

    // Build system prompt
    let systemPrompt = `You are ${agent.name}, a CASCADE AI agent in interactive playground mode.

Mission: ${agent.mission}

${agent.systemPrompt || ''}

You are having a conversation with a user who is testing your capabilities. Be helpful, professional, and demonstrate your expertise. Keep responses focused and actionable.

Expected outputs you can help with: ${agent.outputs.join(', ')}`;

    // Add task packet context if provided
    if (taskPacket) {
      systemPrompt += `\n\nContext provided:`;
      if (taskPacket.client_or_prospect?.name) {
        systemPrompt += `\n- Client: ${taskPacket.client_or_prospect.name}`;
        if (taskPacket.client_or_prospect.industry) {
          systemPrompt += ` (${taskPacket.client_or_prospect.industry})`;
        }
        if (taskPacket.client_or_prospect.location) {
          systemPrompt += ` in ${taskPacket.client_or_prospect.location}`;
        }
      }
      if (taskPacket.client_or_prospect?.goal) {
        systemPrompt += `\n- Goal: ${taskPacket.client_or_prospect.goal}`;
      }
      if (taskPacket.lane && taskPacket.lane !== 'unknown') {
        systemPrompt += `\n- Lane: ${taskPacket.lane}`;
      }
      if (taskPacket.constraints?.budget) {
        systemPrompt += `\n- Budget: ${taskPacket.constraints.budget}`;
      }
      if (taskPacket.constraints?.tools) {
        systemPrompt += `\n- Preferred tools: ${taskPacket.constraints.tools}`;
      }
      if (taskPacket.artifacts?.notes) {
        systemPrompt += `\n- Notes: ${taskPacket.artifacts.notes}`;
      }
    }

    // Build messages array for OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Generate response using the existing generateContent function
    // We'll use a slightly modified approach to support conversation history
    const result = await generateContent(
      messages.slice(0, 1)[0]?.content || null, // system prompt
      messages.slice(1).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n'),
      {
        model: 'gpt-4o-mini',
        maxTokens: 2048,
        temperature: 0.7,
      }
    );

    return NextResponse.json({
      response: result.content,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      costCents: result.costCents,
      model: result.model,
    });
  } catch (error) {
    console.error('Playground error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process playground request' },
      { status: 500 }
    );
  }
}
