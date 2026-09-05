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

  
  app.get('/api/workspaces', (c) => {
    const cwd = process.cwd();
    const workspaceName = path.basename(cwd);
    return c.json({
      currentWorkspace: {
        id: 'ws_default',
        name: workspaceName,
        path: cwd,
        active: true,
      },
      workspaces: [
        { id: 'ws_default', name: workspaceName, path: cwd, active: true },
        { id: 'ws_docs', name: 'Documentation & Guides', path: path.join(cwd, 'docs'), active: false },
        { id: 'ws_experiments', name: 'AI Experiments', path: path.join(cwd, 'experiments'), active: false },
      ],
    });
  });

  
  app.post('/api/compare', async (c) => {
    const body = await c.req.json<{ prompt: string; models: Array<{ providerId: string; modelId: string }> }>();
    const prompt = body.prompt;
    const selectedModels = body.models || [];

    if (!prompt || selectedModels.length === 0) {
      return c.json({ error: 'Prompt and at least one model are required' }, 400);
    }

    const results = await Promise.all(
      selectedModels.map(async (target) => {
        const start = Date.now();
        const adapter = registry.getAdapter(target.providerId);
        try {
          const creds = await registry.getCredentials(target.providerId);
          const response = await adapter.chat(
            {
              modelId: target.modelId,
              messages: [{ role: 'user', content: prompt }],
            },
            creds
          );
          const rawContent = typeof response.message.content === 'string'
            ? response.message.content
            : JSON.stringify(response.message.content);
          const durationSec = (Date.now() - start) / 1000;
          const tokens = response.usage?.totalTokens || Math.round(prompt.length / 4 + rawContent.length / 4);
          const cost = tokens * 0.000005;

          return {
            providerId: target.providerId,
            modelId: target.modelId,
            content: sanitizeText(rawContent),
            durationSec: parseFloat(durationSec.toFixed(2)),
            tokens,
            costUSD: parseFloat(cost.toFixed(4)),
            status: 'success',
          };
        } catch (err: unknown) {
          const durationSec = (Date.now() - start) / 1000;
          const msg = err instanceof Error ? err.message : String(err);
          return {
            providerId: target.providerId,
            modelId: target.modelId,
            content: '',
            error: sanitizeText(msg),
            durationSec: parseFloat(durationSec.toFixed(2)),
            tokens: 0,
            costUSD: 0,
            status: 'error',
          };
        }
      })
    );

    return c.json({ prompt, results });
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
