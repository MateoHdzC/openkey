import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RbacManager, ROLE_DEFAULT_SCOPES } from '../src/security/rbac.js';
import { StorageDatabase } from '../src/storage/db.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('RBAC & Scopes for Virtual Master Keys', () => {
  let testDbPath: string;
  let db: StorageDatabase;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `openkey-rbac-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
    db = new StorageDatabase(testDbPath);
  });

  afterEach(() => {
    try {
      db.close();
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch {}
  });

  it('should generate hashed virtual key with appropriate role scopes', () => {
    const { record, rawKey } = RbacManager.generateKey({
      name: 'CI/CD Pipeline',
      role: 'developer',
    });

    expect(rawKey).toMatch(/^ok-live-[a-f0-9]{48}$/);
    expect(record.keyHash).toBe(RbacManager.hashKey(rawKey));
    expect(record.prefix).toContain('ok-live-');
    expect(record.role).toBe('developer');
    expect(record.scopes).toEqual(ROLE_DEFAULT_SCOPES.developer);
    expect(record.allowedModels).toEqual(['*']);
  });

  it('should correctly evaluate scope hierarchy and wildcard scopes', () => {
    const { record: adminKey } = RbacManager.generateKey({ name: 'Admin', role: 'admin' });
    expect(RbacManager.hasScope(adminKey, 'chat:completions')).toBe(true);
    expect(RbacManager.hasScope(adminKey, 'admin:keys')).toBe(true);

    const { record: readKey } = RbacManager.generateKey({ name: 'Auditor', role: 'readonly' });
    expect(RbacManager.hasScope(readKey, 'models:read')).toBe(true);
    expect(RbacManager.hasScope(readKey, 'chat:completions')).toBe(false);

    const { record: scopedKey } = RbacManager.generateKey({
      name: 'Scoped Bot',
      scopes: ['chat:*'],
    });
    expect(RbacManager.hasScope(scopedKey, 'chat:completions')).toBe(true);
    expect(RbacManager.hasScope(scopedKey, 'models:read')).toBe(false);
  });

  it('should restrict models according to allowedModels list', () => {
    const { record: restrictedKey } = RbacManager.generateKey({
      name: 'Budget Key',
      allowedModels: ['gpt-4o-mini', 'deepseek-*'],
    });

    expect(RbacManager.isModelAllowed(restrictedKey, 'gpt-4o-mini')).toBe(true);
    expect(RbacManager.isModelAllowed(restrictedKey, 'deepseek-chat')).toBe(true);
    expect(RbacManager.isModelAllowed(restrictedKey, 'deepseek-coder')).toBe(true);
    expect(RbacManager.isModelAllowed(restrictedKey, 'o1-preview')).toBe(false);
  });

  it('should enforce rate limits per minute', () => {
    const rbac = new RbacManager();
    const { record: limitedKey } = RbacManager.generateKey({
      name: 'Rate Limited Key',
      rateLimitRpm: 3,
    });

    const now = 50000;
    expect(rbac.checkRateLimit(limitedKey, now).allowed).toBe(true);
    expect(rbac.checkRateLimit(limitedKey, now + 100).allowed).toBe(true);
    expect(rbac.checkRateLimit(limitedKey, now + 200).allowed).toBe(true);

    // 4th request within same minute should be rejected
    const rejected = rbac.checkRateLimit(limitedKey, now + 300);
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfterSeconds).toBeGreaterThan(0);

    // After 61 seconds, request should be allowed again
    expect(rbac.checkRateLimit(limitedKey, now + 61000).allowed).toBe(true);
  });

  it('should enforce daily token budgets', () => {
    const { record: budgetKey } = RbacManager.generateKey({
      name: 'Daily Budget Key',
      dailyTokenBudget: 1000,
    });

    expect(RbacManager.checkTokenBudget(budgetKey, 500).allowed).toBe(true);
    expect(RbacManager.checkTokenBudget(budgetKey, 1500).allowed).toBe(false);
  });

  it('should persist, retrieve, and track usage in SQLite database', () => {
    const { record, rawKey } = RbacManager.generateKey({
      name: 'Integration Key',
      role: 'service',
      dailyTokenBudget: 5000,
    });

    db.saveVirtualKey(record);

    const retrieved = db.getVirtualKeyByHash(RbacManager.hashKey(rawKey));
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(record.id);
    expect(retrieved?.name).toBe('Integration Key');
    expect(retrieved?.tokensUsedToday).toBe(0);

    db.recordVirtualKeyUsage(record.id, 250);
    const updated = db.getVirtualKeyById(record.id);
    expect(updated?.tokensUsedToday).toBe(250);

    const allKeys = db.listVirtualKeys();
    expect(allKeys.some((k) => k.id === record.id)).toBe(true);

    db.deleteVirtualKey(record.id);
    expect(db.getVirtualKeyById(record.id)).toBeNull();
  });
});
