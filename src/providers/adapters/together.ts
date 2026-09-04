import { OpenAIAdapter } from './openai.js';
import type { ProviderMetadata } from '../adapter.interface.js';

export class TogetherAdapter extends OpenAIAdapter {
  public override readonly meta: ProviderMetadata = {
    id: 'together',
    name: 'Together AI',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    websiteUrl: 'https://together.ai',
    docsUrl: 'https://docs.together.ai',
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    supportsModelDiscovery: true,
    defaultModels: [
      {
        id: 'deepseek-ai/DeepSeek-R1',
        name: 'DeepSeek R1 (via Together)',
        providerId: 'together',
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
        id: 'deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek V3 (via Together)',
        providerId: 'together',
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
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        name: 'Llama 3.3 70B Turbo',
        providerId: 'together',
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
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen 2.5 Coder 32B',
        providerId: 'together',
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
