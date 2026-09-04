import { OpenAIAdapter } from './openai.js';
import type { ProviderMetadata } from '../adapter.interface.js';

export class MistralAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata = {
    id: 'mistral',
    name: 'Mistral AI',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    websiteUrl: 'https://mistral.ai',
    docsUrl: 'https://docs.mistral.ai',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large 2',
        providerId: 'mistral',
        description: 'Flagship multilingual reasoning and code model',
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
        id: 'codestral-latest',
        name: 'Codestral 2501',
        providerId: 'mistral',
        description: 'State-of-the-art coding and fill-in-the-middle model with 256k context',
        contextWindow: 256000,
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
        id: 'pixtral-large-latest',
        name: 'Pixtral Large',
        providerId: 'mistral',
        description: 'Multimodal frontier model with image understanding',
        contextWindow: 128000,
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
        id: 'mistral-small-latest',
        name: 'Mistral Small 3',
        providerId: 'mistral',
        description: 'Fast, cost-effective workhorse model',
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
    ],
  };
}
