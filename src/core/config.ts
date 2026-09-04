import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { StorageDatabase } from '../storage/db.js';
import { DEFAULT_PERMISSION_POLICY, type PermissionPolicy } from '../security/permissions.js';

export interface AppConfigData {
  activeProviderId: string;
  activeModelId: string;
  activeKeyId?: string;
  customProviders: Array<{
    id: string;
    name: string;
    baseUrl: string;
    authType: 'bearer' | 'api-key';
    models: string[];
    customHeaders?: Record<string, string>;
  }>;
  permissions: PermissionPolicy;
  theme: 'default' | 'minimal' | 'cyber';
  accentColor: 'red' | 'orange' | 'white' | 'black' | 'blue';
  webPort: number;
}

export const DEFAULT_CONFIG: AppConfigData = {
  activeProviderId: 'openai',
  activeModelId: 'gpt-4o',
  customProviders: [],
  permissions: DEFAULT_PERMISSION_POLICY,
  theme: 'default',
  accentColor: 'blue',
  webPort: 3000,
};

export class ConfigManager {
  private db: StorageDatabase;
  private configPath: string;

  constructor(db?: StorageDatabase) {
    const openKeyDir = path.join(os.homedir(), '.openkey');
    if (!fs.existsSync(openKeyDir)) {
      fs.mkdirSync(openKeyDir, { recursive: true, mode: 0o700 });
    }
    this.configPath = path.join(openKeyDir, 'config.json');
    this.db = db || new StorageDatabase();
  }

  public getConfig(): AppConfigData {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          permissions: {
            ...DEFAULT_CONFIG.permissions,
            ...(parsed.permissions || {}),
          },
        };
      }
    } catch {
    }
    return { ...DEFAULT_CONFIG };
  }

  public saveConfig(config: Partial<AppConfigData>): AppConfigData {
    const current = this.getConfig();
    const updated: AppConfigData = {
      ...current,
      ...config,
      permissions: {
        ...current.permissions,
        ...(config.permissions || {}),
      },
    };

    fs.writeFileSync(this.configPath, JSON.stringify(updated, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });

    return updated;
  }

  public getActiveModelSelection(): { providerId: string; modelId: string; keyId?: string } {
    const config = this.getConfig();
    return {
      providerId: config.activeProviderId,
      modelId: config.activeModelId,
      keyId: config.activeKeyId,
    };
  }

  public setActiveModel(providerId: string, modelId: string, keyId?: string): void {
    this.saveConfig({
      activeProviderId: providerId,
      activeModelId: modelId,
      ...(keyId ? { activeKeyId: keyId } : {}),
    });
  }

  public addCustomProvider(provider: {
    id: string;
    name: string;
    baseUrl: string;
    authType: 'bearer' | 'api-key';
    models: string[];
    customHeaders?: Record<string, string>;
  }): void {
    const config = this.getConfig();
    const filtered = config.customProviders.filter((p) => p.id !== provider.id);
    filtered.push(provider);
    this.saveConfig({ customProviders: filtered });
  }

  public getCustomProviders() {
    return this.getConfig().customProviders;
  }
}
