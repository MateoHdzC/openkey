import { OpenAIAdapter } from './openai.js';
import type { ProviderMetadata, ProviderCredentials, ModelInfo } from '../adapter.interface.js';

export class OpenRouterAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata = {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    websiteUrl: 'https://openrouter.ai',
    docsUrl: 'https://openrouter.ai/docs',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet (via OpenRouter)',
        providerId: 'openrouter',
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
        id: 'openai/gpt-4o',
        name: 'GPT-4o (via OpenRouter)',
        providerId: 'openrouter',
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
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1 (via OpenRouter)',
        providerId: 'openrouter',
        capabilities: {
          text: true,
          streaming: true,
          tools: false,
          vision: false,
          reasoning: true,
          usageMetrics: true,
        },
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B (via OpenRouter)',
        providerId: 'openrouter',
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

  public override async listModels(credentials: ProviderCredentials): Promise<ModelInfo[]> {
    try {
      const baseUrl = (credentials.baseUrl || this.meta.defaultBaseUrl).replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          'HTTP-Referer': 'https://github.com/openkey/openkey',
          'X-Title': 'OpenKey Universal Agent',
        },
      });

      if (!res.ok) return this.meta.defaultModels;

      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          name?: string;
          description?: string;
          context_length?: number;
          architecture?: { modality?: string };
        }>;
      };

      if (!json.data || !Array.isArray(json.data)) return this.meta.defaultModels;

      return json.data.slice(0, 50).map((m) => {
        const isVision = m.architecture?.modality?.includes('image') || m.id.includes('vision') || m.id.includes('4o');
        return {
          id: m.id,
          name: m.name || m.id,
          providerId: 'openrouter',
          description: m.description,
          contextWindow: m.context_length || 128000,
          capabilities: {
            text: true,
            streaming: true,
            tools: !m.id.includes('reasoner'),
            vision: Boolean(isVision),
            reasoning: m.id.includes('r1') || m.id.includes('o1') || m.id.includes('thinking'),
            usageMetrics: true,
          },
        };
      });
    } catch {
      return this.meta.defaultModels;
    }
  }
}
