import type {
  ProviderAdapter,
  ProviderMetadata,
  ModelInfo,
  ProviderCredentials,
} from './adapter.interface.js';
import { OpenAIAdapter } from './adapters/openai.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { DeepSeekAdapter } from './adapters/deepseek.js';
import { GroqAdapter } from './adapters/groq.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { OllamaAdapter } from './adapters/ollama.js';
import { XAIAdapter } from './adapters/xai.js';
import { MistralAdapter } from './adapters/mistral.js';
import { TogetherAdapter } from './adapters/together.js';
import { CustomProviderAdapter } from './adapters/custom.js';
import { ConfigManager } from '../core/config.js';
import { StorageDatabase } from '../storage/db.js';
import { SecretVault } from '../security/vault.js';

export class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();
  private configManager: ConfigManager;
  private db: StorageDatabase;
  private vault: SecretVault;

  constructor(configManager?: ConfigManager, db?: StorageDatabase, vault?: SecretVault) {
    this.db = db || new StorageDatabase();
    this.configManager = configManager || new ConfigManager(this.db);
    this.vault = vault || new SecretVault();

    this.registerAdapter(new OpenAIAdapter());
    this.registerAdapter(new AnthropicAdapter());
    this.registerAdapter(new GeminiAdapter());
    this.registerAdapter(new DeepSeekAdapter());
    this.registerAdapter(new XAIAdapter());
    this.registerAdapter(new MistralAdapter());
    this.registerAdapter(new GroqAdapter());
    this.registerAdapter(new OpenRouterAdapter());
    this.registerAdapter(new TogetherAdapter());
    this.registerAdapter(new OllamaAdapter());

    this.loadCustomProviders();
  }

  public registerAdapter(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.meta.id, adapter);
  }

  public loadCustomProviders(): void {
    const customList = this.configManager.getCustomProviders();
    for (const cp of customList) {
      const adapter = new CustomProviderAdapter({
        id: cp.id,
        name: cp.name,
        defaultBaseUrl: cp.baseUrl,
        defaultModels: cp.models.map((m) => ({
          id: m,
          name: m,
          providerId: cp.id,
          capabilities: {
            text: true,
            streaming: true,
            tools: true,
            vision: false,
            reasoning: false,
            usageMetrics: true,
          },
        })),
      });
      this.registerAdapter(adapter);
    }
  }

  public getAdapter(providerId: string): ProviderAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(
        `Provider "${providerId}" is not registered. Use "/connect" to configure or add this provider.`
      );
    }
    return adapter;
  }

  public listProviders(): ProviderMetadata[] {
    return Array.from(this.adapters.values()).map((a) => a.meta);
  }

  
  public async getCredentials(providerId: string, specificKeyId?: string): Promise<ProviderCredentials> {
    const adapter = this.getAdapter(providerId);

    if (!adapter.meta.requiresApiKey) {
      return { apiKey: '', baseUrl: adapter.meta.defaultBaseUrl };
    }

    const secrets = this.db.getSecretsByProvider(providerId);
    if (secrets.length === 0) {
      throw new Error(
        `No API Key configured for provider "${adapter.meta.name}". Use "/connect" to add your API Key.`
      );
    }

    const secretRecord = specificKeyId
      ? secrets.find((s) => s.id === specificKeyId) || secrets[0]
      : secrets[0];

    const rawKey = this.vault.decryptSecret(secretRecord);
    this.db.updateSecretLastUsed(secretRecord.id);

    return {
      apiKey: rawKey,
      baseUrl: adapter.meta.defaultBaseUrl,
    };
  }

  
  public async discoverModels(providerId?: string): Promise<ModelInfo[]> {
    if (providerId) {
      const adapter = this.getAdapter(providerId);
      try {
        const creds = await this.getCredentials(providerId);
        return await adapter.listModels(creds);
      } catch {
        return adapter.meta.defaultModels;
      }
    }

    const allModels: ModelInfo[] = [];
    for (const [id, adapter] of this.adapters.entries()) {
      try {
        const creds = await this.getCredentials(id);
        const models = await adapter.listModels(creds);
        allModels.push(...models);
      } catch {
        allModels.push(...adapter.meta.defaultModels);
      }
    }
    return allModels;
  }
}
