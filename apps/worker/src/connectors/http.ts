import type { HttpNode } from '@cascade/schemas';

interface HttpResult {
  output: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
  };
}

export async function executeHttpNode(node: HttpNode): Promise<HttpResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), node.timeout);

  try {
    const response = await fetch(node.url, {
      method: node.method,
      headers: node.headers as Record<string, string>,
      body: node.body ? JSON.stringify(node.body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    let body: unknown;

    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      output: {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
