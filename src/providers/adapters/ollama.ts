import type {
  ProviderAdapter,
  ProviderMetadata,
  ProviderCredentials,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ModelInfo,
} from '../adapter.interface.js';
import { sanitizeText } from '../../core/sanitizer.js';

export class OllamaAdapter implements ProviderAdapter {
  public readonly meta: ProviderMetadata = {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultBaseUrl: 'http://localhost:11434',
    websiteUrl: 'https://ollama.com',
    docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
    requiresApiKey: false,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'llama3.2',
        name: 'Llama 3.2',
        providerId: 'ollama',
        description: 'Local lightweight instruction-tuned model',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: false,
          reasoning: false,
          usageMetrics: true,
        },
      },
      {
        id: 'qwen2.5-coder',
        name: 'Qwen 2.5 Coder',
        providerId: 'ollama',
        description: 'Local code intelligence model',
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: false,
          reasoning: false,
          usageMetrics: true,
        },
      },
      {
        id: 'deepseek-r1:8b',
        name: 'DeepSeek R1 8B',
        providerId: 'ollama',
        description: 'Local reasoning model with reasoning chain',
        capabilities: {
          text: true,
          streaming: true,
          tools: false,
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
      const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
      if (!res.ok) {
        return { valid: false, error: `Ollama daemon returned HTTP ${res.status}` };
      }
      return { valid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, error: `Cannot reach Ollama daemon at ${this.getBaseUrl(credentials)}: ${msg}` };
    }
  }

  public async listModels(credentials: ProviderCredentials): Promise<ModelInfo[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials);
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) return this.meta.defaultModels;

      const json = (await res.json()) as { models?: Array<{ name: string; details?: { family?: string } }> };
      if (!json.models || !Array.isArray(json.models)) return this.meta.defaultModels;

      return json.models.map((m) => ({
        id: m.name,
        name: m.name,
        providerId: 'ollama',
        capabilities: {
          text: true,
          streaming: true,
          tools: !m.name.includes('r1'),
          vision: m.name.includes('llava') || m.name.includes('vision'),
          reasoning: m.name.includes('r1'),
          usageMetrics: true,
        },
      }));
    } catch {
      return this.meta.defaultModels;
    }
  }

  public async chat(request: ChatRequest, credentials: ProviderCredentials): Promise<ChatResponse> {
    const baseUrl = this.getBaseUrl(credentials);
    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      stream: false,
      options: {
        temperature: request.temperature ?? 0.7,
      },
    };

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama error (${res.status}): ${sanitizeText(err)}`);
    }

    const json = (await res.json()) as {
      message?: { role: string; content: string };
      prompt_eval_count?: number;
      eval_count?: number;
      done_reason?: string;
    };

    return {
      message: {
        role: 'assistant',
        content: json.message?.content || '',
      },
      usage: {
        inputTokens: json.prompt_eval_count || 0,
        outputTokens: json.eval_count || 0,
        totalTokens: (json.prompt_eval_count || 0) + (json.eval_count || 0),
      },
      finishReason: json.done_reason as any,
    };
  }

  public async *chatStream(request: ChatRequest, credentials: ProviderCredentials): AsyncIterable<StreamChunk> {
    const baseUrl = this.getBaseUrl(credentials);
    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      stream: true,
      options: {
        temperature: request.temperature ?? 0.7,
      },
    };

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      yield { type: 'error', error: `Ollama error (${res.status}): ${sanitizeText(err)}` };
      return;
    }

    if (!res.body) {
      yield { type: 'error', error: 'No response stream from Ollama' };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed);
          if (json.message?.content) {
            yield { type: 'text', content: json.message.content };
          }
          if (json.done) {
            if (json.prompt_eval_count || json.eval_count) {
              yield {
                type: 'usage',
                usage: {
                  inputTokens: json.prompt_eval_count || 0,
                  outputTokens: json.eval_count || 0,
                  totalTokens: (json.prompt_eval_count || 0) + (json.eval_count || 0),
                },
              };
            }
            yield { type: 'done' };
            return;
          }
        } catch {
        }
      }
    }

    yield { type: 'done' };
  }
}
