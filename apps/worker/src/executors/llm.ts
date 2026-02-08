import OpenAI from 'openai';

import { renderTemplate, calculateCostCents, type ExecutionContext } from '@cascade/runtime';
import type { LlmNode } from '@cascade/schemas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LlmResult {
  output: unknown;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

export async function executeLlmNode(
  node: LlmNode,
  ctx: ExecutionContext
): Promise<LlmResult> {
  // Render prompt templates
  const system = node.system ? renderTemplate(node.system, ctx) : undefined;
  const prompt = renderTemplate(node.prompt, ctx);

  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await openai.chat.completions.create({
    model: node.model,
    messages,
    max_tokens: node.maxOutputTokens,
    temperature: node.temperature,
    tools: node.tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),
  });

  const choice = response.choices[0];
  const usage = response.usage;

  // Parse output
  let output: unknown;
  if (choice?.message.tool_calls?.length) {
    // Tool call response
    output = choice.message.tool_calls.map((tc) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));
  } else {
    // Regular text response
    const content = choice?.message.content ?? '';
    // Try to parse as JSON
    try {
      output = JSON.parse(content);
    } catch {
      output = content;
    }
  }

  const tokensIn = usage?.prompt_tokens ?? 0;
  const tokensOut = usage?.completion_tokens ?? 0;
  const costCents = calculateCostCents(node.model, tokensIn, tokensOut);

  return {
    output,
    tokensIn,
    tokensOut,
    costCents,
  };
}
