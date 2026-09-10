import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { getWebHtml } from './html.js';
import { StorageDatabase } from '../storage/db.js';
import { ConfigManager } from '../core/config.js';
import { SecretVault } from '../security/vault.js';
import { ProviderRegistry } from '../providers/registry.js';
import { SystemDoctor } from '../core/doctor.js';
import { OpenKeyAgent } from '../core/agent.js';
import { sanitizeData, sanitizeText } from '../core/sanitizer.js';
import { UpdateManager } from '../core/updater.js';
import path from 'node:path';

export function createWebServer(): Hono {
  const app = new Hono();
  const db = new StorageDatabase();
  const vault = new SecretVault();
  const configManager = new ConfigManager(db);
  const registry = new ProviderRegistry(configManager, db, vault);
  const agent = new OpenKeyAgent({ db, configManager, registry });
  const doctor = new SystemDoctor();

  app.get('/', (c) => {
    return c.html(getWebHtml());
  });

  
  app.get('/api/providers', async (c) => {
    const active = configManager.getActiveModelSelection();
    const providers = registry.listProviders();
    const catalog = [];

    for (const p of providers) {
      try {
        const models = await registry.discoverModels(p.id);
        catalog.push({ ...p, models });
      } catch {
        catalog.push({ ...p, models: p.defaultModels });
      }
    }

    return c.json({
      activeProviderId: active.providerId,
      activeModelId: active.modelId,
      providers: catalog,
    });
  });

  app.post('/api/providers/custom', async (c) => {
    const body = await c.req.json<{
      id: string;
      name: string;
      baseUrl: string;
      authType?: 'bearer' | 'api-key';
      models?: string[];
      apiKey?: string;
    }>();

    if (!body.id || !body.name || !body.baseUrl) {
      return c.json({ success: false, error: 'id, name, and baseUrl are required' }, 400);
    }

    const cleanId = body.id.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const modelList = (body.models && body.models.length > 0)
      ? body.models.map(m => m.trim()).filter(Boolean)
      : [`${cleanId}-default`];

    configManager.addCustomProvider({
      id: cleanId,
      name: body.name.trim(),
      baseUrl: body.baseUrl.trim(),
      authType: body.authType || 'bearer',
      models: modelList,
    });

    registry.loadCustomProviders();

    if (body.apiKey && body.apiKey.trim()) {
      const encrypted = vault.encryptSecret(cleanId, `${cleanId}-key`, body.apiKey.trim());
      db.saveSecret(encrypted);
    }

    return c.json({
      success: true,
      provider: {
        id: cleanId,
        name: body.name.trim(),
        defaultBaseUrl: body.baseUrl.trim(),
        models: modelList,
      },
    });
  });

  app.get('/api/workspace/files', async (c) => {
    const cwd = process.cwd();
    try {
      const fs = await import('node:fs');
      const files: Array<{ name: string; path: string; isDirectory: boolean; size: number }> = [];
      const entries = fs.readdirSync(cwd, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
        const fullPath = path.join(cwd, entry.name);
        const stat = fs.statSync(fullPath);
        files.push({
          name: entry.name,
          path: entry.name,
          isDirectory: entry.isDirectory(),
          size: stat.size,
        });
      }
      return c.json({ cwd, files });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 500);
    }
  });

  app.post('/api/workspace/read-file', async (c) => {
    const body = await c.req.json<{ path: string }>();
    if (!body.path) {
      return c.json({ error: 'Path is required' }, 400);
    }
    const cwd = process.cwd();
    const target = path.resolve(cwd, body.path);
    if (!target.startsWith(cwd)) {
      return c.json({ error: 'Access denied: path outside workspace' }, 403);
    }
    try {
      const fs = await import('node:fs');
      const content = fs.readFileSync(target, 'utf8');
      return c.json({ path: body.path, content });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 500);
    }
  });

  
  app.post('/api/config/active', async (c) => {
    const body = await c.req.json<{ providerId: string; modelId: string }>();
    if (body.providerId && body.modelId) {
      configManager.setActiveModel(body.providerId, body.modelId);
      return c.json({ success: true });
    }
    return c.json({ success: false, error: 'Missing providerId or modelId' }, 400);
  });

  
  app.post('/api/config/theme', async (c) => {
    const body = await c.req.json<{ accentColor: 'blue' | 'red' | 'orange' | 'white' | 'black' }>();
    if (body.accentColor) {
      configManager.saveConfig({ accentColor: body.accentColor });
      return c.json({ success: true });
    }
    return c.json({ success: false, error: 'Missing accentColor' }, 400);
  });

  
  app.get('/api/keys', (c) => {
    const keys = db.listSecretsMeta();
    return c.json(keys);
  });

  
  app.post('/api/keys', async (c) => {
    const body = await c.req.json<{ providerId: string; name: string; apiKey: string }>();
    if (!body.providerId || !body.apiKey) {
      return c.json({ success: false, error: 'Provider and API Key are required' }, 400);
    }

    const encrypted = vault.encryptSecret(body.providerId, body.name || `${body.providerId}-key`, body.apiKey);
    db.saveSecret(encrypted);
    return c.json({ success: true, id: encrypted.id, maskedKey: encrypted.maskedKey });
  });

  
  app.delete('/api/keys/:id', (c) => {
    const id = c.req.param('id');
    db.deleteSecret(id);
    return c.json({ success: true });
  });

  
  app.get('/api/sessions', (c) => {
    const sessions = db.listSessions();
    return c.json(sessions);
  });

  app.post('/api/sessions', async (c) => {
    const body = await c.req.json<{ title?: string }>().catch(() => ({ title: 'New Chat' }));
    const active = configManager.getActiveModelSelection();
    const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const title = body.title || 'New Chat';
    
    db.createSession({
      id,
      title,
      providerId: active.providerId,
      modelId: active.modelId,
      createdAt: now,
      updatedAt: now,
    });

    return c.json({ id, title, providerId: active.providerId, modelId: active.modelId });
  });

  app.get('/api/sessions/:id', (c) => {
    const id = c.req.param('id');
    const session = db.getSession(id);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    const messages = db.getSessionMessages(id);
    return c.json({ ...session, messages });
  });

  app.put('/api/sessions/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ title: string }>();
    if (!body.title) {
      return c.json({ error: 'Title is required' }, 400);
    }
    db.updateSessionTitle(id, body.title.trim());
    return c.json({ success: true });
  });

  app.put('/api/sessions/:id/model', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ providerId: string; modelId: string }>();
    if (!body.providerId || !body.modelId) {
      return c.json({ error: 'Missing providerId or modelId' }, 400);
    }
    db.updateSessionModel(id, body.providerId, body.modelId);
    return c.json({ success: true });
  });

  app.delete('/api/sessions/:id', (c) => {
    const id = c.req.param('id');
    db.deleteSession(id);
    return c.json({ success: true });
  });

  
  app.get('/v1/models', async (c) => {
    try {
      const presets = db.listPresets();
      const providers = registry.listProviders();
      const modelData = [];

      for (const pr of presets) {
        modelData.push({
          id: pr.alias,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: `preset (${pr.providerId}/${pr.modelId})`,
          permission: [],
          root: pr.modelId,
          parent: pr.providerId,
        });
      }

      for (const p of providers) {
        for (const m of p.defaultModels) {
          modelData.push({
            id: m.id,
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: p.id,
            permission: [],
            root: m.id,
            parent: p.id,
          });
          modelData.push({
            id: `${p.id}/${m.id}`,
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: p.id,
            permission: [],
            root: m.id,
            parent: p.id,
          });
        }
      }

      return c.json({
        object: 'list',
        data: modelData,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: { message: msg, type: 'invalid_request_error' } }, 500);
    }
  });

  app.post('/v1/chat/completions', async (c) => {
    const start = Date.now();
    try {
      const body = await c.req.json<{
        model?: string;
        messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>;
        stream?: boolean;
        temperature?: number;
        max_tokens?: number;
      }>();

      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        return c.json({ error: { message: 'messages is required and must be a non-empty array', type: 'invalid_request_error' } }, 400);
      }

      const requestedModel = body.model || 'coding';
      const resolved = registry.resolvePresetOrModel(requestedModel);
      const adapter = registry.getAdapter(resolved.providerId);
      const creds = await registry.getCredentials(resolved.providerId);

      if (body.stream) {
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const chunkId = `chatcmpl-${Date.now()}`;
            const created = Math.floor(Date.now() / 1000);

            try {
              for await (const chunk of adapter.chatStream(
                {
                  modelId: resolved.modelId,
                  messages: body.messages,
                  temperature: body.temperature,
                  maxTokens: body.max_tokens,
                },
                creds
              )) {
                if (chunk.content) {
                  const dataPayload = {
                    id: chunkId,
                    object: 'chat.completion.chunk',
                    created,
                    model: requestedModel,
                    choices: [
                      {
                        index: 0,
                        delta: { content: chunk.content },
                        finish_reason: null,
                      },
                    ],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(dataPayload)}\n\n`));
                }
              }

              const donePayload = {
                id: chunkId,
                object: 'chat.completion.chunk',
                created,
                model: requestedModel,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  },
                ],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(donePayload)}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));

              const durationMs = Date.now() - start;
              db.logUsage({
                timestamp: new Date().toISOString(),
                providerId: resolved.providerId,
                modelId: resolved.modelId,
                durationMs,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                status: 'success',
              });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              const errPayload = {
                error: {
                  message: `[Zero Silent Fallback] Provider ${resolved.providerId} failed: ${msg}`,
                  type: 'upstream_error',
                  providerId: resolved.providerId,
                  modelId: resolved.modelId,
                  retryable: true,
                },
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errPayload)}\n\n`));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      const response = await adapter.chat(
        {
          modelId: resolved.modelId,
          messages: body.messages,
          temperature: body.temperature,
          maxTokens: body.max_tokens,
        },
        creds
      );

      const durationMs = Date.now() - start;
      const totalTokens = response.usage?.totalTokens || 0;
      const inputTokens = response.usage?.inputTokens || 0;
      const outputTokens = response.usage?.outputTokens || 0;

      db.logUsage({
        timestamp: new Date().toISOString(),
        providerId: resolved.providerId,
        modelId: resolved.modelId,
        durationMs,
        inputTokens,
        outputTokens,
        totalTokens,
        status: 'success',
      });

      return c.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestedModel,
        resolvedModel: {
          providerId: resolved.providerId,
          modelId: resolved.modelId,
          presetAlias: resolved.presetAlias,
        },
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.message.content,
            },
            finish_reason: response.finishReason || 'stop',
          },
        ],
        usage: {
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: totalTokens,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json(
        {
          error: {
            message: `[Zero Silent Fallback] ${msg}`,
            type: 'upstream_error',
            retryable: true,
          },
        },
        500
      );
    }
  });

  app.get('/api/profiles', (c) => {
    const profiles = db.listProfiles();
    return c.json(profiles);
  });

  app.post('/api/profiles', async (c) => {
    const body = await c.req.json<{
      providerId: string;
      name: string;
      baseUrl?: string;
      authType?: 'bearer' | 'api-key';
      customHeaders?: Record<string, string>;
      models?: string[];
      apiKey?: string;
    }>();

    if (!body.providerId || !body.name) {
      return c.json({ success: false, error: 'providerId and name are required' }, 400);
    }

    const now = new Date().toISOString();
    let keyId: string | undefined;

    if (body.apiKey && body.apiKey.trim()) {
      const encrypted = vault.encryptSecret(body.providerId, `${body.name} Key`, body.apiKey.trim());
      db.saveSecret(encrypted);
      keyId = encrypted.id;
    }

    const profile = {
      id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      providerId: body.providerId,
      name: body.name.trim(),
      baseUrl: body.baseUrl ? body.baseUrl.trim() : undefined,
      authType: body.authType || 'bearer',
      customHeaders: body.customHeaders,
      models: body.models && body.models.length > 0 ? body.models : [],
      keyId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.saveProfile(profile);
    db.setActiveProfile(profile.id, body.providerId);

    return c.json({ success: true, profile });
  });

  app.post('/api/profiles/:id/activate', (c) => {
    const id = c.req.param('id');
    const profile = db.getProfile(id);
    if (!profile) {
      return c.json({ success: false, error: 'Profile not found' }, 404);
    }
    db.setActiveProfile(id, profile.providerId);
    return c.json({ success: true });
  });

  app.delete('/api/profiles/:id', (c) => {
    const id = c.req.param('id');
    db.deleteProfile(id);
    return c.json({ success: true });
  });

  app.get('/api/presets', (c) => {
    const presets = db.listPresets();
    return c.json(presets);
  });

  app.post('/api/presets', async (c) => {
    const body = await c.req.json<{
      alias: string;
      name: string;
      providerId: string;
      modelId: string;
      description?: string;
    }>();

    if (!body.alias || !body.providerId || !body.modelId) {
      return c.json({ success: false, error: 'alias, providerId, and modelId are required' }, 400);
    }

    const existing = db.getPresetByAlias(body.alias);
    const preset = {
      id: existing ? existing.id : `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      alias: body.alias.trim().toLowerCase(),
      name: body.name || body.alias,
      providerId: body.providerId,
      modelId: body.modelId,
      description: body.description || '',
      updatedAt: new Date().toISOString(),
    };

    db.savePreset(preset);
    return c.json({ success: true, preset });
  });

  app.get('/api/workspaces', (c) => {
    const workspaces = db.listWorkspaces();
    const active = db.getActiveWorkspace();
    const cwd = process.cwd();

    if (workspaces.length === 0) {
      const defaultWs = {
        id: 'ws_default',
        name: path.basename(cwd) || 'Workspace',
        path: cwd,
        defaultProviderId: 'openai',
        defaultModelId: 'gpt-4o',
        contextPaths: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveWorkspace(defaultWs);
      return c.json({ currentWorkspace: defaultWs, workspaces: [defaultWs] });
    }

    return c.json({
      currentWorkspace: active || workspaces[0],
      workspaces,
    });
  });

  app.post('/api/workspaces', async (c) => {
    const body = await c.req.json<{
      name: string;
      path?: string;
      defaultProviderId?: string;
      defaultModelId?: string;
      systemInstructions?: string;
      contextPaths?: string[];
    }>();

    if (!body.name) {
      return c.json({ success: false, error: 'Workspace name is required' }, 400);
    }

    const activeSel = configManager.getActiveModelSelection();
    const now = new Date().toISOString();
    const ws = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: body.name.trim(),
      path: body.path || process.cwd(),
      defaultProviderId: body.defaultProviderId || activeSel.providerId,
      defaultModelId: body.defaultModelId || activeSel.modelId,
      systemInstructions: body.systemInstructions,
      contextPaths: body.contextPaths || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.saveWorkspace(ws);
    db.setActiveWorkspace(ws.id);
    return c.json({ success: true, workspace: ws });
  });

  app.post('/api/workspaces/:id/activate', (c) => {
    const id = c.req.param('id');
    db.setActiveWorkspace(id);
    return c.json({ success: true });
  });

  app.delete('/api/workspaces/:id', (c) => {
    const id = c.req.param('id');
    db.deleteWorkspace(id);
    return c.json({ success: true });
  });

  app.post('/api/vault/export', async (c) => {
    const body = await c.req.json<{ password: string }>();
    if (!body.password || body.password.length < 4) {
      return c.json({ success: false, error: 'Password must be at least 4 characters' }, 400);
    }
    try {
      const data = db.getAllDataForExport();
      const envelope = vault.exportEncryptedArchive(data, body.password);
      return c.json({ success: true, envelope });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  app.post('/api/vault/import', async (c) => {
    const body = await c.req.json<{ envelope: import('../security/vault.js').EncryptedArchiveEnvelope; password: string }>();
    if (!body.envelope || !body.password) {
      return c.json({ success: false, error: 'Envelope and password are required' }, 400);
    }
    try {
      const decryptedData = vault.importEncryptedArchive<Record<string, unknown>>(body.envelope, body.password);
      db.importAllData(decryptedData);
      return c.json({ success: true, message: 'Vault archive successfully restored' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 400);
    }
  });

  app.get('/api/context/scan', async (c) => {
    const cwd = process.cwd();
    try {
      const fs = await import('node:fs');
      const excludedPatterns = ['.git', 'node_modules', 'dist', '.env', '.env.local', 'openkey.sqlite'];
      const fileList: Array<{ path: string; name: string; size: number; isSecretCandidate: boolean }> = [];

      function scan(dir: string, depth: number = 0) {
        if (depth > 4) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (excludedPatterns.some((p) => entry.name === p || entry.name.endsWith('.sqlite'))) continue;
          const full = path.join(dir, entry.name);
          const rel = path.relative(cwd, full);
          if (entry.isDirectory()) {
            scan(full, depth + 1);
          } else if (entry.isFile()) {
            const stat = fs.statSync(full);
            const isSecretCandidate = entry.name.includes('.env') || entry.name.includes('secret') || entry.name.endsWith('.pem');
            fileList.push({
              path: rel.replace(/\\/g, '/'),
              name: entry.name,
              size: stat.size,
              isSecretCandidate,
            });
          }
        }
      }

      scan(cwd);
      return c.json({ cwd, files: fileList });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 500);
    }
  });

  app.get('/api/data/export', (c) => {
    const exportData = db.getAllDataForExport();
    return c.json(exportData);
  });

  app.get('/api/usage', (c) => {
    const summary = db.getUsageSummary();
    return c.json(summary);
  });

  app.get('/api/doctor', async (c) => {
    const checks = await doctor.runAllChecks();
    return c.json(checks);
  });

  
  app.post('/api/chat/stream', async (c) => {
    const body = await c.req.json<{ prompt: string; sessionId?: string; providerId?: string; modelId?: string }>();
    const prompt = body.prompt;
    let sessionId = body.sessionId;

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const active = configManager.getActiveModelSelection();
    const providerId = body.providerId || active.providerId;
    const modelId = body.modelId || active.modelId;
    const now = new Date().toISOString();

    if (!sessionId || !db.getSession(sessionId)) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = prompt.length > 38 ? prompt.substring(0, 35) + '...' : prompt;
      db.createSession({
        id: sessionId,
        title,
        providerId,
        modelId,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      db.updateSessionModel(sessionId, providerId, modelId);
    }

    db.saveMessage({
      sessionId,
      role: 'user',
      content: prompt,
      timestamp: now,
    });

    const previousMessages = db.getSessionMessages(sessionId).slice(0, -1).map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant' | 'tool',
      content: m.content,
    }));

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let assistantFullText = '';

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session', sessionId, providerId, modelId })}\n\n`));

          for await (const event of agent.run(prompt, previousMessages)) {
            if (event.type === 'token' && event.content) {
              assistantFullText += event.content;
            }
            const sanitizedEvent = sanitizeData(event);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(sanitizedEvent)}\n\n`));
          }

          if (assistantFullText) {
            db.saveMessage({
              sessionId,
              role: 'assistant',
              content: assistantFullText,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  });

  const updater = new UpdateManager();

  app.get('/api/update/check', async (c) => {
    try {
      const result = await updater.checkForUpdates();
      return c.json({ success: true, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  app.post('/api/update/apply', async (c) => {
    try {
      const result = await updater.applyUpdate();
      return c.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  return app;
}

export function startLocalWebServer(port: number = 3000, silent: boolean = false): Promise<{ port: number; host: string; close: () => void }> {
  return new Promise((resolve) => {
    const app = createWebServer();
    const host = '127.0.0.1';

    try {
      const server = serve(
        {
          fetch: app.fetch,
          port,
          hostname: host,
        },
        (info) => {
          if (!silent) {
            console.log(`\n🚀 OpenKey Web Studio listening on http://${host}:${info.port}\n`);
          }
          resolve({
            port: info.port,
            host,
            close: () => server.close(),
          });
        }
      );

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          if (!silent) {
            console.log(`\nℹ️  OpenKey Web Studio already running on http://${host}:${port}\n`);
          }
        } else if (!silent) {
          console.error(`Web server error:`, err.message);
        }
        resolve({
          port,
          host,
          close: () => {},
        });
      });
    } catch {
      resolve({
        port,
        host,
        close: () => {},
      });
    }
  });
}
