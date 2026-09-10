import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageDatabase } from '../src/storage/db.js';
import { SecretVault } from '../src/security/vault.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Storage Database (SQLite)', () => {
  let db: StorageDatabase;
  let tempDbPath: string;

  beforeEach(() => {
    tempDbPath = path.join(os.tmpdir(), `openkey_test_${Date.now()}_${Math.random().toString(36).slice(2)}.sqlite`);
    db = new StorageDatabase(tempDbPath);
  });

  afterEach(() => {
    try {
      db.close();
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {}
  });

  it('should store and retrieve encrypted secrets', () => {
    const vault = new SecretVault();
    const record = vault.encryptSecret('openai', 'default', 'sk-test-key-value-1234567890');
    db.saveSecret(record);

    const retrieved = db.getSecret(record.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.providerId).toBe('openai');
    expect(retrieved?.maskedKey).toBe(record.maskedKey);

    const list = db.listSecretsMeta();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(record.id);
  });

  it('should record usage metrics and compute correct aggregates', () => {
    db.logUsage({
      timestamp: new Date().toISOString(),
      providerId: 'openai',
      modelId: 'gpt-4o',
      durationMs: 1200,
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      status: 'success',
    });

    db.logUsage({
      timestamp: new Date().toISOString(),
      providerId: 'anthropic',
      modelId: 'claude-3-5-sonnet',
      durationMs: 800,
      inputTokens: 200,
      outputTokens: 100,
      totalTokens: 300,
      status: 'success',
    });

    const summary = db.getUsageSummary();
    expect(summary.totalRequests).toBe(2);
    expect(summary.totalInputTokens).toBe(300);
    expect(summary.totalOutputTokens).toBe(150);
    expect(summary.totalTokens).toBe(450);
    expect(summary.byProvider.length).toBe(2);
  });

  it('should handle sessions and conversation persistence', () => {
    const sessionId = 'session_123';
    db.createSession({
      id: sessionId,
      title: 'Test Debugging',
      providerId: 'openai',
      modelId: 'gpt-4o',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.saveMessage({
      sessionId,
      role: 'user',
      content: 'Hello AI',
      timestamp: new Date().toISOString(),
    });

    db.saveMessage({
      sessionId,
      role: 'assistant',
      content: 'Hello user!',
      timestamp: new Date().toISOString(),
    });

    const messages = db.getSessionMessages(sessionId);
    expect(messages.length).toBe(2);
    expect(messages[0].content).toBe('Hello AI');
    expect(messages[1].content).toBe('Hello user!');
  });

  it('should manage provider profiles and fast switching', () => {
    const profile = {
      id: 'prof_test_1',
      providerId: 'openai',
      name: 'OpenAI Personal',
      baseUrl: 'https://api.openai.com/v1',
      authType: 'bearer' as const,
      models: ['gpt-4o', 'o1-mini'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveProfile(profile);
    const profiles = db.listProfiles('openai');
    expect(profiles.length).toBe(1);
    expect(profiles[0].name).toBe('OpenAI Personal');
    expect(profiles[0].isActive).toBe(true);

    db.setActiveProfile(profile.id, 'openai');
    const retrieved = db.getProfile(profile.id);
    expect(retrieved?.isActive).toBe(true);
  });

  it('should seed default presets and resolve them correctly', () => {
    const presets = db.listPresets();
    expect(presets.length).toBeGreaterThanOrEqual(5);

    const codingPreset = db.getPresetByAlias('coding');
    expect(codingPreset).not.toBeNull();
    expect(codingPreset?.providerId).toBe('deepseek');
    expect(codingPreset?.modelId).toBe('deepseek-chat');

    const fastPreset = db.getPresetByAlias('fast');
    expect(fastPreset).not.toBeNull();
    expect(fastPreset?.providerId).toBe('groq');
  });

  it('should manage workspaces and isolation', () => {
    const ws = {
      id: 'ws_custom_1',
      name: 'Frontend Project',
      path: 'c:/projects/frontend',
      defaultProviderId: 'anthropic',
      defaultModelId: 'claude-3-7-sonnet-latest',
      contextPaths: ['src', 'components'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveWorkspace(ws);
    const list = db.listWorkspaces();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const activeWs = db.getActiveWorkspace();
    expect(activeWs?.name).toBe('Frontend Project');
  });

  it('should export all data and import it accurately with encryption', () => {
    const vault = new SecretVault();
    const data = db.getAllDataForExport();
    expect(data.presets.length).toBeGreaterThan(0);

    const envelope = vault.exportEncryptedArchive(data, 'SuperSecretPass123!');
    expect(envelope.payload).toBeDefined();
    expect(envelope.authTag).toBeDefined();

    const decrypted = vault.importEncryptedArchive<typeof data>(envelope, 'SuperSecretPass123!');
    expect(decrypted.presets.length).toBe(data.presets.length);

    expect(() => {
      vault.importEncryptedArchive(envelope, 'WrongPass');
    }).toThrow();
  });
});

