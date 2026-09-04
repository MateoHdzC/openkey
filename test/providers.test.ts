import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProviderRegistry } from '../src/providers/registry.js';
import { StorageDatabase } from '../src/storage/db.js';
import { ConfigManager } from '../src/core/config.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Provider Registry & Adapter Discovery', () => {
  let db: StorageDatabase;
  let tempDbPath: string;

  beforeEach(() => {
    tempDbPath = path.join(os.tmpdir(), `openkey_prov_test_${Date.now()}_${Math.random().toString(36).slice(2)}.sqlite`);
    db = new StorageDatabase(tempDbPath);
  });

  afterEach(() => {
    try {
      db.close();
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {}
  });

  it('should list all built-in providers without duplicates', () => {
    const config = new ConfigManager(db);
    const registry = new ProviderRegistry(config, db);

    const providers = registry.listProviders();
    const ids = providers.map((p) => p.id);

    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('gemini');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('xai');
    expect(ids).toContain('mistral');
    expect(ids).toContain('groq');
    expect(ids).toContain('openrouter');
    expect(ids).toContain('together');
    expect(ids).toContain('ollama');
  });

  it('should dynamically register and load custom providers', () => {
    const config = new ConfigManager(db);
    config.addCustomProvider({
      id: 'custom_local_lm',
      name: 'Local LM Studio',
      baseUrl: 'http://localhost:1234/v1',
      authType: 'bearer',
      models: ['qwen-coder-32b', 'deepseek-r1-q4'],
    });

    const registry = new ProviderRegistry(config, db);
    const adapter = registry.getAdapter('custom_local_lm');

    expect(adapter).toBeDefined();
    expect(adapter.meta.name).toBe('Local LM Studio');
    expect(adapter.meta.defaultModels.length).toBe(2);
  });
});
