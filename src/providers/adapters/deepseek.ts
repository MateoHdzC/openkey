import { OpenAIAdapter } from './openai.js';
import type { ProviderMetadata, ProviderCredentials, StreamChunk, ChatRequest } from '../adapter.interface.js';
import { sanitizeText } from '../../core/sanitizer.js';

export class DeepSeekAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata = {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    websiteUrl: 'https://deepseek.com',
    docsUrl: 'https://platform.deepseek.com/api-docs',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'deepseek-chat',
        name: 'deepseek-chat',
        providerId: 'deepseek',
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
        id: 'deepseek-reasoner',
        name: 'deepseek-reasoner',
        providerId: 'deepseek',
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

  public override async *chatStream(request: ChatRequest, credentials: ProviderCredentials): AsyncIterable<StreamChunk> {
    const baseUrl = (credentials.baseUrl || this.meta.defaultBaseUrl).replace(/\/+$/, '');
    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: request.temperature ?? 0.7,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
    };

    if (request.tools && request.tools.length > 0 && request.modelId !== 'deepseek-reasoner') {
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
        error: `DeepSeek API error (${res.status}): ${sanitizeText(errText)}`,
      };
      return;
    }

    if (!res.body) {
      yield { type: 'error', error: 'No response body received from DeepSeek' };
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
        if (!trimmed.startsWith('data:')) continue;
        if (trimmed === 'data: [DONE]') {
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
          if (delta?.reasoning_content) {
            yield { type: 'reasoning', content: delta.reasoning_content };
          }
          if (delta?.content) {
            yield { type: 'text', content: delta.content };
          }
        } catch {
        }
      }
    }

    yield { type: 'done' };
  }
}
