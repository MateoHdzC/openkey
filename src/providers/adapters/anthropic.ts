import type {
  ProviderAdapter,
  ProviderMetadata,
  ProviderCredentials,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ModelInfo,
  ChatMessage,
  ToolCall,
} from '../adapter.interface.js';
import { sanitizeText } from '../../core/sanitizer.js';

export class AnthropicAdapter implements ProviderAdapter {
  public readonly meta: ProviderMetadata = {
    id: 'anthropic',
    name: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    websiteUrl: 'https://anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'claude-3-7-sonnet-20250219',
        providerId: 'anthropic',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: true,
          reasoning: true,
          usageMetrics: true,
        },
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'claude-3-5-sonnet-20241022',
        providerId: 'anthropic',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: true,
          reasoning: false,
          usageMetrics: true,
        },
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'claude-3-5-haiku-20241022',
        providerId: 'anthropic',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: true,
          reasoning: false,
          usageMetrics: true,
        },
      },
    ],
  };

  private getBaseUrl(creds: ProviderCredentials): string {
    return (creds.baseUrl || this.meta.defaultBaseUrl).replace(/\/+$/, '');
  }

  public async validateCredentials(credentials: ProviderCredentials): Promise<{ valid: boolean; error?: string }> {
    try {
      const baseUrl = this.getBaseUrl(credentials);
      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'x-api-key': credentials.apiKey,
          'anthropic-version': '2023-06-01',
          ...(credentials.headers || {}),
        },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return {
          valid: false,
          error: `HTTP ${res.status}: ${sanitizeText(errorBody) || res.statusText}`,
        };
      }
      return { valid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, error: sanitizeText(msg) };
    }
  }

  public async listModels(credentials: ProviderCredentials): Promise<ModelInfo[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials);
      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'x-api-key': credentials.apiKey,
          'anthropic-version': '2023-06-01',
          ...(credentials.headers || {}),
        },
      });

      if (!res.ok) return this.meta.defaultModels;

      const json = (await res.json()) as { data?: Array<{ id: string; display_name?: string }> };
      if (!json.data || !Array.isArray(json.data)) return this.meta.defaultModels;

      return json.data.map((m) => ({
        id: m.id,
        name: m.display_name || m.id,
        providerId: 'anthropic',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: true,
          reasoning: m.id.includes('3-7'),
          usageMetrics: true,
        },
      }));
    } catch {
      return this.meta.defaultModels;
    }
  }

  private formatAnthropicMessages(messages: ChatMessage[]) {
    let system = '';
    const filtered: Array<{ role: 'user' | 'assistant'; content: unknown }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system += (typeof msg.content === 'string' ? msg.content : '') + '\n';
        continue;
      }

      if (msg.role === 'tool') {
        filtered.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId || 'tool_call',
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            },
          ],
        });
        continue;
      }

      if (typeof msg.content === 'string') {
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          const contents: unknown[] = [{ type: 'text', text: msg.content }];
          for (const tc of msg.toolCalls) {
            contents.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            });
          }
          filtered.push({ role: msg.role as 'user' | 'assistant', content: contents });
        } else {
          filtered.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
        }
      } else {
        const parts = msg.content.map((part) => {
          if (part.type === 'text') {
            return { type: 'text', text: part.text || '' };
          }
          if (part.type === 'image' && part.imageData) {
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: part.imageData.mimeType,
                data: part.imageData.dataBase64,
              },
            };
          }
          return { type: 'text', text: '' };
        });
        filtered.push({ role: msg.role as 'user' | 'assistant', content: parts });
      }
    }

    return { system: system.trim() || undefined, messages: filtered };
  }

  public async chat(request: ChatRequest, credentials: ProviderCredentials): Promise<ChatResponse> {
    const baseUrl = this.getBaseUrl(credentials);
    const { system, messages } = this.formatAnthropicMessages(request.messages);

    const body: Record<string, unknown> = {
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
      ...(system || request.systemPrompt ? { system: system || request.systemPrompt } : {}),
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': credentials.apiKey,
        'anthropic-version': '2023-06-01',
        ...(credentials.headers || {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${sanitizeText(errText)}`);
    }

    const json = (await res.json()) as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      usage?: { input_tokens: number; output_tokens: number };
      stop_reason: string;
    };

    let textContent = '';
    const toolCalls: ToolCall[] = [];

    for (const item of json.content || []) {
      if (item.type === 'text' && item.text) {
        textContent += item.text;
      } else if (item.type === 'tool_use' && item.name) {
        toolCalls.push({
          id: item.id || `tu_${Date.now()}`,
          name: item.name,
          arguments: item.input || {},
        });
      }
    }

    return {
      message: {
        role: 'assistant',
        content: textContent,
        ...(toolCalls.length > 0 ? { toolCalls } : {}),
      },
      usage: json.usage
        ? {
            inputTokens: json.usage.input_tokens,
            outputTokens: json.usage.output_tokens,
            totalTokens: json.usage.input_tokens + json.usage.output_tokens,
          }
        : undefined,
      finishReason: json.stop_reason as any,
    };
  }

  public async *chatStream(request: ChatRequest, credentials: ProviderCredentials): AsyncIterable<StreamChunk> {
    const baseUrl = this.getBaseUrl(credentials);
    const { system, messages } = this.formatAnthropicMessages(request.messages);

    const body: Record<string, unknown> = {
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens || 4096,
      stream: true,
      temperature: request.temperature ?? 0.7,
      ...(system || request.systemPrompt ? { system: system || request.systemPrompt } : {}),
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': credentials.apiKey,
        'anthropic-version': '2023-06-01',
        ...(credentials.headers || {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      yield {
        type: 'error',
        error: `Anthropic API error (${res.status}): ${sanitizeText(errText)}`,
      };
      return;
    }

    if (!res.body) {
      yield { type: 'error', error: 'No response body received from Anthropic' };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentToolCall: { id: string; name: string; inputJson: string } | null = null;
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;

        try {
          const event = JSON.parse(dataStr);
          if (event.type === 'message_start' && event.message?.usage) {
            inputTokens = event.message.usage.input_tokens || 0;
          }
          if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            currentToolCall = {
              id: event.content_block.id || `tu_${Date.now()}`,
              name: event.content_block.name || '',
              inputJson: '',
            };
          }
          if (event.type === 'content_block_delta') {
            if (event.delta?.type === 'text_delta') {
              yield { type: 'text', content: event.delta.text };
            } else if (event.delta?.type === 'thinking_delta') {
              yield { type: 'reasoning', content: event.delta.thinking };
            } else if (event.delta?.type === 'input_json_delta' && currentToolCall) {
              currentToolCall.inputJson += event.delta.partial_json;
            }
          }
          if (event.type === 'content_block_stop' && currentToolCall) {
            let parsed = {};
            try {
              parsed = JSON.parse(currentToolCall.inputJson);
            } catch {
              parsed = { raw: currentToolCall.inputJson };
            }
            yield {
              type: 'tool_call',
              toolCall: {
                id: currentToolCall.id,
                name: currentToolCall.name,
                arguments: parsed,
              },
            };
            currentToolCall = null;
          }
          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens || 0;
            yield {
              type: 'usage',
              usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
              },
            };
          }
        } catch {
        }
      }
    }

    yield { type: 'done' };
  }
}
