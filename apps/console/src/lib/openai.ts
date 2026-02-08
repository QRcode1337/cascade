import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerationResult {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

// Cost per 1K tokens (GPT-4o-mini pricing)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['gpt-4o-mini']!;
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  return Math.round((inputCost + outputCost) * 100); // Convert to cents
}

export async function generateContent(
  systemPrompt: string | null,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<GenerationResult> {
  const model = options.model || 'gpt-4o-mini';
  const maxTokens = options.maxTokens || 2048;
  const temperature = options.temperature ?? 0.7;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0 };
  const content = completion.choices[0]?.message?.content || '';

  return {
    content,
    model,
    tokensIn: usage.prompt_tokens,
    tokensOut: usage.completion_tokens,
    costCents: calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
  };
}

export async function generateAgentOutput(
  agentName: string,
  agentMission: string,
  systemPrompt: string | null,
  outputType: string,
  context: {
    clientInfo?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    artifacts?: unknown[];
    previousOutputs?: Record<string, unknown>;
  }
): Promise<GenerationResult> {
  // Build a comprehensive system prompt
  const fullSystemPrompt = `You are ${agentName}, a CASCADE AI agent.

Mission: ${agentMission}

${systemPrompt || ''}

You produce professional, actionable outputs for local business clients. Be specific, practical, and results-oriented.`;

  // Build the user prompt based on output type and context
  let userPrompt = `Generate the following output: ${outputType}

`;

  if (context.clientInfo) {
    userPrompt += `Client/Prospect Information:
${JSON.stringify(context.clientInfo, null, 2)}

`;
  }

  if (context.constraints) {
    userPrompt += `Constraints and Requirements:
${JSON.stringify(context.constraints, null, 2)}

`;
  }

  if (context.artifacts && context.artifacts.length > 0) {
    userPrompt += `Reference Materials:
${JSON.stringify(context.artifacts, null, 2)}

`;
  }

  if (context.previousOutputs && Object.keys(context.previousOutputs).length > 0) {
    userPrompt += `Previous Step Outputs (for context):
${JSON.stringify(context.previousOutputs, null, 2)}

`;
  }

  userPrompt += `Please generate a complete, professional ${outputType}. Format your response appropriately for the content type (use markdown if helpful).`;

  return generateContent(fullSystemPrompt, userPrompt, {
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
  });
}

export { openai };
