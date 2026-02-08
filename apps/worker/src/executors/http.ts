import { renderTemplate, renderObjectTemplates, type ExecutionContext } from '@cascade/runtime';
import type { HttpNode } from '@cascade/schemas';

interface HttpResult {
  output: unknown;
}

export async function executeHttpNode(
  node: HttpNode,
  ctx: ExecutionContext
): Promise<HttpResult> {
  // Render URL and headers
  const url = renderTemplate(node.url, ctx);
  const headers = node.headers
    ? renderObjectTemplates(node.headers, ctx)
    : undefined;
  const body = node.body
    ? renderObjectTemplates(node.body, ctx)
    : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), node.timeout);

  try {
    const response = await fetch(url, {
      method: node.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Parse response
    const contentType = response.headers.get('content-type') ?? '';
    let output: unknown;

    if (contentType.includes('application/json')) {
      output = await response.json();
    } else {
      output = await response.text();
    }

    // Include response metadata
    return {
      output: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: output,
      },
    };
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`HTTP request timed out after ${node.timeout}ms`);
    }
    throw err;
  }
}
