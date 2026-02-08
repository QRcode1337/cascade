import OpenAI from 'openai';
import { renderTemplate } from '@cascade/runtime';
import { calculateCostCents } from '@cascade/runtime';
import type { LlmNode } from '@cascade/schemas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LlmResult {
  output: {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export async function executeLlmNode(node: LlmNode, context: Record<string, unknown>): Promise<LlmResult> {
  const systemPrompt = node.system ? renderTemplate(node.system, context) : undefined;
  const userPrompt = renderTemplate(node.prompt, context);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const completion = await openai.chat.completions.create({
    model: node.model,
    messages,
    max_tokens: node.maxOutputTokens,
    temperature: node.temperature,
    tools: node.tools?.length
      ? node.tools.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        }))
      : undefined,
  });

  const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const content = completion.choices[0]?.message?.content || '';

  const cost = calculateCostCents(node.model, usage.prompt_tokens, usage.completion_tokens);

  return {
    output: {
      content,
      model: node.model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    },
    tokensIn: usage.prompt_tokens,
    tokensOut: usage.completion_tokens,
    cost,
  };
}
