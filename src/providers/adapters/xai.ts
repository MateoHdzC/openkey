import { OpenAIAdapter } from './openai.js';
import type { ProviderMetadata } from '../adapter.interface.js';

export class XAIAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata = {
    id: 'xai',
    name: 'xAI (Grok)',
    defaultBaseUrl: 'https://api.x.ai/v1',
    websiteUrl: 'https://x.ai',
    docsUrl: 'https://docs.x.ai',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'grok-2-latest',
        name: 'Grok 2',
        providerId: 'xai',
        description: 'State-of-the-art frontier model by xAI with strong reasoning',
        contextWindow: 131072,
        capabilities: {
          text: true,
          streaming: true,
          tools: true,
          vision: false,
          reasoning: true,
          usageMetrics: true,
        },
      },
      {
        id: 'grok-2-vision-latest',
        name: 'Grok 2 Vision',
        providerId: 'xai',
        description: 'Multimodal vision and visual document understanding model',
        contextWindow: 32768,
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
        id: 'grok-beta',
        name: 'Grok Beta',
        providerId: 'xai',
        description: 'High-speed Grok model',
        contextWindow: 131072,
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
