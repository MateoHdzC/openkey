import { OpenAIAdapter } from './openai.js';
import type { ProviderMetadata } from '../adapter.interface.js';

export class GroqAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata = {
    id: 'groq',
    name: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    websiteUrl: 'https://groq.com',
    docsUrl: 'https://console.groq.com/docs',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        providerId: 'groq',
        description: 'High-speed 70B parameter general purpose model powered by LPU',
        contextWindow: 128000,
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
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        providerId: 'groq',
        description: 'Ultra-fast low-latency 8B model',
        contextWindow: 128000,
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
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        providerId: 'groq',
        description: 'MoE model with 32k context and fast execution',
        contextWindow: 32768,
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
