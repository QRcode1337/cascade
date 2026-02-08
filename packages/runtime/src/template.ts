import Mustache from 'mustache';

// Disable HTML escaping since we're not rendering HTML
Mustache.escape = (text: string) => text;

/**
 * Render a template string with context values
 * Uses Mustache-style {{variable}} syntax
 */
export function renderTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  try {
    // Transform context for Mustache (it expects flat or properly nested objects)
    const view = prepareView(context);
    return Mustache.render(template, view);
  } catch (err) {
    console.error('Template rendering error:', err);
    return template;
  }
}

/**
 * Prepare context for Mustache rendering
 */
function prepareView(context: Record<string, unknown>): Record<string, unknown> {
  return {
    ctx: context,
    // Also expose top-level keys directly
    ...context,
  };
}

/**
 * Extract all variable references from a template
 */
export function extractVariables(template: string): string[] {
  const tokens = Mustache.parse(template);
  const variables: string[] = [];

  function extractFromTokens(tokens: Array<[string, string, number, number]>) {
    for (const token of tokens) {
      const [type, name] = token;
      if (type === 'name' || type === '&' || type === '{') {
        variables.push(name);
      }
    }
  }

  extractFromTokens(tokens as Array<[string, string, number, number]>);
  return [...new Set(variables)];
}

/**
 * Validate a template string
 */
export function validateTemplate(template: string): {
  valid: boolean;
  error?: string;
  variables: string[];
} {
  try {
    const variables = extractVariables(template);
    return { valid: true, variables };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid template',
      variables: [],
    };
  }
}

/**
 * Render an object recursively, processing all string values as templates
 */
export function renderObjectTemplates<T>(
  obj: T,
  context: Record<string, unknown>
): T {
  if (typeof obj === 'string') {
    return renderTemplate(obj, context) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => renderObjectTemplates(item, context)) as T;
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = renderObjectTemplates(value, context);
    }
    return result as T;
  }

  return obj;
}
