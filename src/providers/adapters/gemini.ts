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

export class GeminiAdapter implements ProviderAdapter {
  public readonly meta: ProviderMetadata = {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    websiteUrl: 'https://ai.google.dev',
    docsUrl: 'https://ai.google.dev/docs',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        providerId: 'gemini',
        description: 'Next-gen multimodal workhorse model with high speed and tool support',
        contextWindow: 1048576,
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
        id: 'gemini-2.0-pro-exp',
        name: 'Gemini 2.0 Pro Experimental',
        providerId: 'gemini',
        description: 'Advanced reasoning and complex task performance',
        contextWindow: 2097152,
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
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        providerId: 'gemini',
        description: 'Deep multimodal understanding with 2M token context window',
        contextWindow: 2097152,
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
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        providerId: 'gemini',
        description: 'Fast and lightweight model optimized for high-volume tasks',
        contextWindow: 1048576,
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
      const res = await fetch(`${baseUrl}/models?key=${credentials.apiKey}`, {
        method: 'GET',
        headers: credentials.headers || {},
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
      const res = await fetch(`${baseUrl}/models?key=${credentials.apiKey}`, {
        method: 'GET',
        headers: credentials.headers || {},
      });

      if (!res.ok) return this.meta.defaultModels;

      const json = (await res.json()) as {
        models?: Array<{ name: string; displayName?: string; description?: string; inputTokenLimit?: number }>;
      };

      if (!json.models || !Array.isArray(json.models)) return this.meta.defaultModels;

      return json.models
        .filter((m) => m.name.includes('gemini'))
        .map((m) => {
          const id = m.name.replace('models/', '');
          return {
            id,
            name: m.displayName || id,
            providerId: 'gemini',
            description: m.description,
            contextWindow: m.inputTokenLimit || 1048576,
            capabilities: {
              text: true,
              streaming: true,
              tools: true,
              vision: true,
              reasoning: id.includes('pro') || id.includes('thinking'),
              usageMetrics: true,
            },
          };
        });
    } catch {
      return this.meta.defaultModels;
    }
  }

  private formatContents(messages: ChatMessage[]) {
    let systemInstruction: { parts: Array<{ text: string }> } | undefined;
    const contents: Array<{ role: 'user' | 'model'; parts: unknown[] }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        const text = typeof msg.content === 'string' ? msg.content : '';
        systemInstruction = { parts: [{ text }] };
        continue;
      }

      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: unknown[] = [];

      if (msg.role === 'tool') {
        parts.push({
          functionResponse: {
            name: msg.name || 'tool_response',
            response: { output: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) },
          },
        });
      } else if (typeof msg.content === 'string') {
        if (msg.content) parts.push({ text: msg.content });
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.arguments,
              },
            });
          }
        }
      } else {
        for (const p of msg.content) {
          if (p.type === 'text' && p.text) {
            parts.push({ text: p.text });
          } else if (p.type === 'image' && p.imageData) {
            parts.push({
              inlineData: {
                mimeType: p.imageData.mimeType,
                data: p.imageData.dataBase64,
              },
            });
          }
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    return { systemInstruction, contents };
  }

  public async chat(request: ChatRequest, credentials: ProviderCredentials): Promise<ChatResponse> {
    const baseUrl = this.getBaseUrl(credentials);
    const { systemInstruction, contents } = this.formatContents(request.messages);
    const model = request.modelId.replace(/^models\//, '');
    const body: Record<string, unknown> = {
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
      },
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${credentials.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(credentials.headers || {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Gemini API error (${res.status}): ${sanitizeText(errText)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }> };
        finishReason?: string;
      }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    };

    const candidate = json.candidates?.[0];
    let textContent = '';
    const toolCalls: ToolCall[] = [];

    for (const part of candidate?.content?.parts || []) {
      if (part.text) {
        textContent += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          id: `gemini_tc_${Date.now()}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args || {},
        });
      }
    }

    return {
      message: {
        role: 'assistant',
        content: textContent,
        ...(toolCalls.length > 0 ? { toolCalls } : {}),
      },
      usage: json.usageMetadata
        ? {
            inputTokens: json.usageMetadata.promptTokenCount || 0,
            outputTokens: json.usageMetadata.candidatesTokenCount || 0,
            totalTokens: json.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
      finishReason: candidate?.finishReason as any,
    };
  }

  public async *chatStream(request: ChatRequest, credentials: ProviderCredentials): AsyncIterable<StreamChunk> {
    const baseUrl = this.getBaseUrl(credentials);
    const { systemInstruction, contents } = this.formatContents(request.messages);
    const model = request.modelId.replace(/^models\//, '');

    const body: Record<string, unknown> = {
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
      },
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const res = await fetch(`${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${credentials.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(credentials.headers || {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      yield {
        type: 'error',
        error: `Google Gemini API error (${res.status}): ${sanitizeText(errText)}`,
      };
      return;
    }

    if (!res.body) {
      yield { type: 'error', error: 'No response body received from Gemini' };
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
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          if (data.usageMetadata) {
            yield {
              type: 'usage',
              usage: {
                inputTokens: data.usageMetadata.promptTokenCount || 0,
                outputTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
              },
            };
          }

          const candidate = data.candidates?.[0];
          for (const part of candidate?.content?.parts || []) {
            if (part.text) {
              yield { type: 'text', content: part.text };
            }
            if (part.functionCall) {
              yield {
                type: 'tool_call',
                toolCall: {
                  id: `gemini_call_${Date.now()}`,
                  name: part.functionCall.name,
                  arguments: part.functionCall.args || {},
                },
              };
            }
          }
        } catch {
        }
      }
    }

    yield { type: 'done' };
  }
}
