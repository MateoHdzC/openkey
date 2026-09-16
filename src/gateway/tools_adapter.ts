import type { ToolDefinition, ToolCall, ChatMessage } from '../providers/adapter.interface.js';

export interface OpenAiToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface AnthropicToolDefinition {
  name: string;
  description?: string;
  input_schema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface GeminiToolDefinition {
  function_declarations: GeminiFunctionDeclaration[];
}

export class UnifiedToolsAdapter {
  /**
   * Normalizes any tool format (OpenAI, Anthropic, or raw ToolDefinition) into OpenKey unified ToolDefinition[]
   */
  static toUnifiedTools(rawTools: unknown[]): ToolDefinition[] {
    if (!Array.isArray(rawTools)) return [];

    const result: ToolDefinition[] = [];

    for (const item of rawTools) {
      if (!item || typeof item !== 'object') continue;

      const obj = item as Record<string, unknown>;

      // OpenAI format: { type: 'function', function: { name, description, parameters } }
      if (obj.type === 'function' && obj.function && typeof obj.function === 'object') {
        const fn = obj.function as Record<string, unknown>;
        const name = String(fn.name || '');
        if (!name) continue;

        const rawParams = (fn.parameters as Record<string, unknown>) || {};
        const parameters = {
          type: 'object' as const,
          properties: (rawParams.properties as Record<string, unknown>) || {},
          required: Array.isArray(rawParams.required) ? (rawParams.required as string[]) : undefined,
        };

        result.push({
          name,
          description: String(fn.description || ''),
          parameters,
        });
        continue;
      }

      // Anthropic format: { name, description, input_schema }
      if ('name' in obj && 'input_schema' in obj && typeof obj.input_schema === 'object') {
        const schema = obj.input_schema as Record<string, unknown>;
        result.push({
          name: String(obj.name),
          description: String(obj.description || ''),
          parameters: {
            type: 'object',
            properties: (schema.properties as Record<string, unknown>) || {},
            required: Array.isArray(schema.required) ? (schema.required as string[]) : undefined,
          },
        });
        continue;
      }

      // OpenKey native / standard ToolDefinition: { name, description, parameters }
      if ('name' in obj && 'parameters' in obj && typeof obj.parameters === 'object') {
        const params = obj.parameters as Record<string, unknown>;
        result.push({
          name: String(obj.name),
          description: String(obj.description || ''),
          parameters: {
            type: 'object',
            properties: (params.properties as Record<string, unknown>) || {},
            required: Array.isArray(params.required) ? (params.required as string[]) : undefined,
          },
        });
      }
    }

    return result;
  }

  /**
   * Converts OpenKey unified ToolDefinitions to OpenAI-compatible format
   */
  static toOpenAiFormat(tools: ToolDefinition[]): OpenAiToolDefinition[] {
    return tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: t.parameters.properties || {},
          required: t.parameters.required || [],
        },
      },
    }));
  }

  /**
   * Converts OpenKey unified ToolDefinitions to Anthropic Claude tool format
   */
  static toAnthropicFormat(tools: ToolDefinition[]): AnthropicToolDefinition[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: {
        type: 'object',
        properties: t.parameters.properties || {},
        required: t.parameters.required || [],
      },
    }));
  }

  /**
   * Converts OpenKey unified ToolDefinitions to Google Gemini function declaration format
   */
  static toGeminiFormat(tools: ToolDefinition[]): GeminiToolDefinition {
    return {
      function_declarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: 'OBJECT',
          properties: t.parameters.properties || {},
          required: t.parameters.required || [],
        },
      })),
    };
  }

  /**
   * Normalizes tool calls returned by Anthropic, Gemini, or OpenAI into unified ToolCall[]
   */
  static normalizeToolCalls(providerId: string, rawResponse: unknown): ToolCall[] {
    if (!rawResponse || typeof rawResponse !== 'object') return [];

    const pId = providerId.toLowerCase();
    const raw = rawResponse as Record<string, unknown>;

    // 1. Anthropic: response has content array with type: 'tool_use'
    if (pId.includes('anthropic') && Array.isArray(raw.content)) {
      const calls: ToolCall[] = [];
      for (const block of raw.content) {
        if (block && typeof block === 'object' && (block as Record<string, unknown>).type === 'tool_use') {
          const tb = block as { id?: string; name?: string; input?: unknown };
          calls.push({
            id: tb.id || `call_${Math.random().toString(36).substring(2, 9)}`,
            name: tb.name || '',
            arguments: (tb.input as Record<string, unknown>) || {},
          });
        }
      }
      if (calls.length > 0) return calls;
    }

    // 2. Gemini: response has candidates[0].content.parts[].functionCall
    if (pId.includes('gemini') && Array.isArray(raw.candidates)) {
      const calls: ToolCall[] = [];
      const first = (raw.candidates as unknown[])[0] as Record<string, unknown> | undefined;
      const parts = (first?.content as Record<string, unknown> | undefined)?.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part && typeof part === 'object' && 'functionCall' in part) {
            const fc = (part as { functionCall: { name?: string; args?: Record<string, unknown> } }).functionCall;
            calls.push({
              id: `call_${Math.random().toString(36).substring(2, 9)}`,
              name: fc.name || '',
              arguments: fc.args || {},
            });
          }
        }
      }
      if (calls.length > 0) return calls;
    }

    // 3. OpenAI format: message.tool_calls or choices[0].message.tool_calls
    const toolCallsList =
      (raw.tool_calls as unknown[]) ||
      ((raw.message as Record<string, unknown> | undefined)?.tool_calls as unknown[]) ||
      ((((raw.choices as unknown[])?.[0] as Record<string, unknown> | undefined)?.message as Record<string, unknown> | undefined)?.tool_calls as unknown[]);

    if (Array.isArray(toolCallsList)) {
      return toolCallsList
        .filter((tc): tc is Record<string, unknown> => !!tc && typeof tc === 'object')
        .map((tc) => {
          let parsedArgs: Record<string, unknown> = {};
          const fn = (tc.function as Record<string, unknown>) || {};
          if (typeof fn.arguments === 'string') {
            try {
              parsedArgs = JSON.parse(fn.arguments);
            } catch {
              parsedArgs = { raw: fn.arguments };
            }
          } else if (typeof fn.arguments === 'object' && fn.arguments) {
            parsedArgs = fn.arguments as Record<string, unknown>;
          } else if (typeof tc.arguments === 'object' && tc.arguments) {
            parsedArgs = tc.arguments as Record<string, unknown>;
          }

          return {
            id: String(tc.id || `call_${Math.random().toString(36).substring(2, 9)}`),
            name: String(fn.name || tc.name || ''),
            arguments: parsedArgs,
          };
        });
    }

    return [];
  }

  /**
   * Formats a tool execution output into an OpenAI-compatible / ChatMessage object
   */
  static formatToolResult(toolCallId: string, toolName: string, output: unknown): ChatMessage {
    const stringified = typeof output === 'string' ? output : JSON.stringify(output);
    return {
      role: 'tool',
      name: toolName,
      toolCallId,
      content: stringified,
    };
  }
}
