import { OpenAIAdapter } from './openai.js';
import type {
  ProviderMetadata,
  ProviderCredentials,
  ModelInfo,
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from '../adapter.interface.js';

export class CustomProviderAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata;

  constructor(customMeta?: Partial<ProviderMetadata>) {
    super();
    this.meta = {
      id: customMeta?.id || 'custom',
      name: customMeta?.name || 'Custom / Another Provider',
      defaultBaseUrl: customMeta?.defaultBaseUrl || 'https://api.openai.com/v1',
      websiteUrl: customMeta?.websiteUrl || '',
      docsUrl: customMeta?.docsUrl || '',
      requiresApiKey: customMeta?.requiresApiKey ?? true,
      supportsCustomBaseUrl: true,
      supportsModelDiscovery: true,
      defaultModels: customMeta?.defaultModels || [
        {
          id: 'default-model',
          name: 'Default Model',
          providerId: customMeta?.id || 'custom',
          capabilities: {
            text: true,
            streaming: true,
            tools: true,
            vision: false,
            reasoning: false,
            usageMetrics: true,
          },
        },
      ],
    };
  }

  public override async validateCredentials(credentials: ProviderCredentials): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.baseUrl) {
      return { valid: false, error: 'Base URL is required for custom providers' };
    }

    const authHeaders: Record<string, string> = {};
    if (credentials.apiKey) {
      if (credentials.authType === 'api-key') {
        authHeaders['x-api-key'] = credentials.apiKey;
      } else {
        authHeaders['Authorization'] = `Bearer ${credentials.apiKey}`;
      }
    }

    try {
      const baseUrl = credentials.baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          ...authHeaders,
          ...(credentials.headers || {}),
        },
      });

      if (!res.ok) {
        return {
          valid: true,
        };
      }

      return { valid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, error: `Connection failed: ${msg}` };
    }
  }

  public override async listModels(credentials: ProviderCredentials): Promise<ModelInfo[]> {
    if (!credentials.baseUrl) return this.meta.defaultModels;

    const authHeaders: Record<string, string> = {};
    if (credentials.apiKey) {
      if (credentials.authType === 'api-key') {
        authHeaders['x-api-key'] = credentials.apiKey;
      } else {
        authHeaders['Authorization'] = `Bearer ${credentials.apiKey}`;
      }
    }

    try {
      const baseUrl = credentials.baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          ...authHeaders,
          ...(credentials.headers || {}),
        },
      });

      if (!res.ok) return this.meta.defaultModels;

      const json = (await res.json()) as { data?: Array<{ id: string }> };
      if (!json.data || !Array.isArray(json.data)) return this.meta.defaultModels;

      return json.data.map((m) => ({
        id: m.id,
        name: m.id,
        providerId: this.meta.id,
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: false,
          reasoning: false,
          usageMetrics: true,
        },
      }));
    } catch {
      return this.meta.defaultModels;
    }
  }
}
