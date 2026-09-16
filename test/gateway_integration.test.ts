import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createWebServer } from '../src/web/server.js';
import { StorageDatabase } from '../src/storage/db.js';
import { RbacManager } from '../src/security/rbac.js';
import { ModelCircuitBreaker } from '../src/gateway/circuit_breaker.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Gateway Integration Tests (Circuit Breaker, RBAC, Context Compression)', () => {
  let testDbPath: string;
  let db: StorageDatabase;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `openkey-gw-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
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

  it('should allow open access to /v1/models when no virtual keys are registered', async () => {
    const app = createWebServer({ db });
    const res = await app.request('/v1/models');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.object).toBe('list');
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('should enforce RBAC authentication when virtual keys exist in database', async () => {
    const { record, rawKey } = RbacManager.generateKey({
      name: 'Test App',
      role: 'developer',
    });
    db.saveVirtualKey(record);

    const app = createWebServer({ db });

    // 1. Without auth header -> 401
    const unauthRes = await app.request('/v1/models');
    expect(unauthRes.status).toBe(401);

    // 2. With invalid token -> 401
    const badTokenRes = await app.request('/v1/models', {
      headers: { Authorization: 'Bearer invalid-token-123' },
    });
    expect(badTokenRes.status).toBe(401);

    // 3. With valid virtual key -> 200
    const authRes = await app.request('/v1/models', {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    expect(authRes.status).toBe(200);
  });

  it('should reject requests with 403 when key lacks required scope', async () => {
    const { record, rawKey } = RbacManager.generateKey({
      name: 'Readonly Key',
      role: 'readonly', // Only models:read, usage:read
    });
    db.saveVirtualKey(record);

    const app = createWebServer({ db });

    const completionRes = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'coding',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    expect(completionRes.status).toBe(403);
    const body = await completionRes.json();
    expect(body.error.message).toContain('chat:completions');
  });

  it('should return 503 circuit_breaker_open when model is tripped', async () => {
    const cb = new ModelCircuitBreaker({ failureThreshold: 1, cooldownMs: 10000 });
    // Trip deepseek:deepseek-chat
    cb.recordFailure('deepseek', 'deepseek-chat');

    const app = createWebServer({ db, circuitBreaker: cb });

    const res = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.type).toBe('circuit_breaker_open');
    expect(body.error.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should compress context via /api/context/compress endpoint', async () => {
    const app = createWebServer({ db });

    const longMessages = [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Message 1 ' + 'A'.repeat(500) },
      { role: 'assistant', content: 'Message 2 ' + 'B'.repeat(500) },
      { role: 'user', content: 'Recent question' },
    ];

    const res = await app.request('/api/context/compress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: longMessages,
        maxTokens: 150,
        preserveRecentCount: 1,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isCompressed).toBe(true);
    expect(data.stats.tokensSaved).toBeGreaterThan(0);
  });

  it('should provide CRUD API for RBAC virtual keys', async () => {
    const app = createWebServer({ db });

    // 1. Create key
    const createRes = await app.request('/api/rbac/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Web UI Generated Key',
        role: 'developer',
      }),
    });
    expect(createRes.status).toBe(200);
    const createData = await createRes.json();
    expect(createData.rawKey).toMatch(/^ok-live-/);
    const keyId = createData.key.id;

    // 2. List keys
    const listRes = await app.request('/api/rbac/keys');
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.some((k: any) => k.id === keyId)).toBe(true);

    // 3. Delete key
    const delRes = await app.request(`/api/rbac/keys/${keyId}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const listAfter = await app.request('/api/rbac/keys');
    const listAfterData = await listAfter.json();
    expect(listAfterData.some((k: any) => k.id === keyId)).toBe(false);
  });
});
