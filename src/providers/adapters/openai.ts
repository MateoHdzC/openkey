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

export class OpenAIAdapter implements ProviderAdapter {
  public readonly meta: ProviderMetadata = {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    websiteUrl: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/docs',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'gpt-4o',
        name: 'gpt-4o',
        providerId: 'openai',
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
        id: 'gpt-4o-mini',
        name: 'gpt-4o-mini',
        providerId: 'openai',
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
        id: 'o1',
        name: 'o1',
        providerId: 'openai',
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
        id: 'o3-mini',
        name: 'o3-mini',
        providerId: 'openai',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: false,
          reasoning: true,
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
          Authorization: `Bearer ${credentials.apiKey}`,
          ...(credentials.organizationId ? { 'OpenAI-Organization': credentials.organizationId } : {}),
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
          Authorization: `Bearer ${credentials.apiKey}`,
          ...(credentials.headers || {}),
        },
      });

      if (!res.ok) {
        return this.meta.defaultModels;
      }

      const json = (await res.json()) as { data?: Array<{ id: string }> };
      if (!json.data || !Array.isArray(json.data)) {
        return this.meta.defaultModels;
      }

      const chatModels = json.data
        .map((m) => m.id)
        .filter((id) => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.includes('chat'));

      if (chatModels.length === 0) {
        return this.meta.defaultModels;
      }

      return chatModels.map((id) => {
        const isVision = id.includes('4o') || id.includes('vision');
        const isReasoning = id.startsWith('o1') || id.startsWith('o3');
        return {
          id,
          name: id,
          providerId: 'openai',
          capabilities: {
            text: true,
            streaming: true,
            tools: !id.includes('instruct'),
            vision: isVision,
            reasoning: isReasoning,
            usageMetrics: true,
          },
        };
      });
    } catch {
      return this.meta.defaultModels;
    }
  }

  private formatMessages(messages: ChatMessage[]) {
    return messages.map((msg) => {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content,
          ...(msg.toolCalls
            ? {
                tool_calls: msg.toolCalls.map((tc) => ({
                  id: tc.id,
                  type: 'function',
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.arguments),
                  },
                })),
              }
            : {}),
          ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
        };
      }

      const parts = msg.content.map((part) => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text || '' };
        }
        if (part.type === 'image' && part.imageData) {
          return {
            type: 'image_url',
            image_url: {
              url: `data:${part.imageData.mimeType};base64,${part.imageData.dataBase64}`,
            },
          };
        }
        if (part.type === 'image' && part.imageUrl) {
          return {
            type: 'image_url',
            image_url: {
              url: part.imageUrl.url,
              detail: part.imageUrl.detail || 'auto',
            },
          };
        }
        return { type: 'text', text: '' };
      });

      return {
        role: msg.role,
        content: parts,
      };
    });
  }

  public async chat(request: ChatRequest, credentials: ProviderCredentials): Promise<ChatResponse> {
    const baseUrl = this.getBaseUrl(credentials);
    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature ?? 0.7,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
        ...(credentials.headers || {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${sanitizeText(errText)}`);
    }

    const json = (await res.json()) as {
      choices: Array<{
        message: {
          role: string;
          content: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
        finish_reason: string;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = json.choices[0];
    const toolCalls: ToolCall[] | undefined = choice?.message?.tool_calls?.map((tc) => {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        parsedArgs = { raw: tc.function.arguments };
      }
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: parsedArgs,
      };
    });

    return {
      message: {
        role: 'assistant',
        content: choice?.message?.content || '',
        ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
      },
      usage: json.usage
        ? {
            inputTokens: json.usage.prompt_tokens,
            outputTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
      finishReason: choice?.finish_reason as any,
    };
  }

  public async *chatStream(request: ChatRequest, credentials: ProviderCredentials): AsyncIterable<StreamChunk> {
    const baseUrl = this.getBaseUrl(credentials);
    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: this.formatMessages(request.messages),
      stream: true,
      stream_options: { include_usage: true },
      temperature: request.temperature ?? 0.7,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
        ...(credentials.headers || {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      yield {
        type: 'error',
        error: `OpenAI API error (${res.status}): ${sanitizeText(errText)}`,
      };
      return;
    }

    if (!res.body) {
      yield { type: 'error', error: 'No response body received from OpenAI' };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const activeToolCalls: Record<number, { id: string; name: string; argumentsRaw: string }> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        if (trimmed === 'data: [DONE]') {
          for (const tc of Object.values(activeToolCalls)) {
            let parsed = {};
            try {
              parsed = JSON.parse(tc.argumentsRaw);
            } catch {
              parsed = { raw: tc.argumentsRaw };
            }
            yield {
              type: 'tool_call',
              toolCall: {
                id: tc.id,
                name: tc.name,
                arguments: parsed,
              },
            };
          }
          yield { type: 'done' };
          return;
        }

        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          if (json.usage) {
            yield {
              type: 'usage',
              usage: {
                inputTokens: json.usage.prompt_tokens,
                outputTokens: json.usage.completion_tokens,
                totalTokens: json.usage.total_tokens,
              },
            };
          }

          const delta = json.choices?.[0]?.delta;
          if (delta?.content) {
            yield { type: 'text', content: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!activeToolCalls[idx]) {
                activeToolCalls[idx] = { id: tc.id || `tc_${idx}`, name: tc.function?.name || '', argumentsRaw: '' };
              }
              if (tc.id) activeToolCalls[idx].id = tc.id;
              if (tc.function?.name) activeToolCalls[idx].name = tc.function.name;
              if (tc.function?.arguments) activeToolCalls[idx].argumentsRaw += tc.function.arguments;
            }
          }
        } catch {
        }
      }
    }

    yield { type: 'done' };
  }
}
