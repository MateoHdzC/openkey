import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import type { EncryptedSecretRecord, StoredSecretMeta } from '../security/vault.js';

export interface ProviderProfileRecord {
  id: string;
  providerId: string;
  name: string;
  baseUrl?: string;
  authType: 'bearer' | 'api-key';
  customHeaders?: Record<string, string>;
  models: string[];
  keyId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelPresetRecord {
  id: string;
  alias: string;
  name: string;
  providerId: string;
  modelId: string;
  description: string;
  isDefault?: boolean;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  path: string;
  defaultProviderId: string;
  defaultModelId: string;
  systemInstructions?: string;
  contextPaths: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id?: number;
  timestamp: string;
  providerId: string;
  modelId: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  status: 'success' | 'error';
  errorType?: string;
  costEstimateUSD?: number;
}

export interface SessionRecord {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id?: number;
  sessionId: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: string;
  toolCallId?: string;
  timestamp: string;
}

export class StorageDatabase {
  private db: DatabaseSync;
  private dbPath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else {
      const openKeyDir = path.join(os.homedir(), '.openkey');
      if (!fs.existsSync(openKeyDir)) {
        fs.mkdirSync(openKeyDir, { recursive: true, mode: 0o700 });
      }
      this.dbPath = path.join(openKeyDir, 'openkey.sqlite');
    }

    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS secrets (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        name TEXT NOT NULL,
        masked_key TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_used_at TEXT
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        status TEXT NOT NULL,
        error_type TEXT,
        cost_estimate_usd REAL
      );
      CREATE INDEX IF NOT EXISTS idx_usage_provider ON usage_logs(provider_id);
      CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        workspace_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls TEXT,
        tool_call_id TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS provider_profiles (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        name TEXT NOT NULL,
        base_url TEXT,
        auth_type TEXT NOT NULL,
        custom_headers_json TEXT,
        models_json TEXT NOT NULL,
        key_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_profiles_provider ON provider_profiles(provider_id);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS model_presets (
        id TEXT PRIMARY KEY,
        alias TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        description TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        default_provider_id TEXT NOT NULL,
        default_model_id TEXT NOT NULL,
        system_instructions TEXT,
        context_paths_json TEXT,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.seedDefaultPresets();
  }

  private seedDefaultPresets(): void {
    const existing = this.listPresets();
    if (existing.length === 0) {
      const defaults: ModelPresetRecord[] = [
        {
          id: 'preset_fast',
          alias: 'fast',
          name: 'Fast / Low Latency',
          providerId: 'groq',
          modelId: 'llama-3.3-70b-versatile',
          description: 'High throughput, low latency responses for everyday queries',
          isDefault: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'preset_coding',
          alias: 'coding',
          name: 'Coding & Architecture',
          providerId: 'deepseek',
          modelId: 'deepseek-chat',
          description: 'Optimized for complex development, refactoring, and code analysis',
          isDefault: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'preset_reasoning',
          alias: 'reasoning',
          name: 'Deep Reasoning',
          providerId: 'openai',
          modelId: 'o1-mini',
          description: 'Step-by-step logic, math, multi-stage planning, and verification',
          isDefault: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'preset_cheap',
          alias: 'cheap',
          name: 'Cost Effective',
          providerId: 'gemini',
          modelId: 'gemini-1.5-flash',
          description: 'Minimal token cost with solid capability for broad tasks',
          isDefault: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'preset_quality',
          alias: 'quality',
          name: 'Best Quality',
          providerId: 'anthropic',
          modelId: 'claude-3-7-sonnet-latest',
          description: 'Top tier nuance, precision, reasoning, and instruction following',
          isDefault: true,
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const preset of defaults) {
        this.savePreset(preset);
      }
    }
  }

  public saveSecret(record: EncryptedSecretRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO secrets (id, provider_id, name, masked_key, ciphertext, iv, auth_tag, salt, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.id,
      record.providerId,
      record.name,
      record.maskedKey,
      record.ciphertext,
      record.iv,
      record.authTag,
      record.salt,
      record.createdAt,
      record.lastUsedAt || null
    );
  }

  public getSecret(id: string): EncryptedSecretRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM secrets WHERE id = ?`);
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      providerId: row.provider_id as string,
      name: row.name as string,
      maskedKey: row.masked_key as string,
      ciphertext: row.ciphertext as string,
      iv: row.iv as string,
      authTag: row.auth_tag as string,
      salt: row.salt as string,
      createdAt: row.created_at as string,
      lastUsedAt: (row.last_used_at as string) || undefined,
    };
  }

  public getSecretsByProvider(providerId: string): EncryptedSecretRecord[] {
    const stmt = this.db.prepare(`SELECT * FROM secrets WHERE provider_id = ? ORDER BY created_at DESC`);
    const rows = stmt.all(providerId) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: row.id as string,
      providerId: row.provider_id as string,
      name: row.name as string,
      maskedKey: row.masked_key as string,
      ciphertext: row.ciphertext as string,
      iv: row.iv as string,
      authTag: row.auth_tag as string,
      salt: row.salt as string,
      createdAt: row.created_at as string,
      lastUsedAt: (row.last_used_at as string) || undefined,
    }));
  }

  public listSecretsMeta(): StoredSecretMeta[] {
    const stmt = this.db.prepare(`SELECT id, provider_id, name, masked_key, created_at, last_used_at FROM secrets ORDER BY provider_id, created_at DESC`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((row) => ({
      id: row.id as string,
      providerId: row.provider_id as string,
      name: row.name as string,
      maskedKey: row.masked_key as string,
      createdAt: row.created_at as string,
      lastUsedAt: (row.last_used_at as string) || undefined,
    }));
  }

  public updateSecretLastUsed(id: string): void {
    const stmt = this.db.prepare(`UPDATE secrets SET last_used_at = ? WHERE id = ?`);
    stmt.run(new Date().toISOString(), id);
  }

  public deleteSecret(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM secrets WHERE id = ?`);
    stmt.run(id);
    return true;
  }

  public saveProfile(profile: ProviderProfileRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO provider_profiles (id, provider_id, name, base_url, auth_type, custom_headers_json, models_json, key_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      profile.id,
      profile.providerId,
      profile.name,
      profile.baseUrl || null,
      profile.authType,
      profile.customHeaders ? JSON.stringify(profile.customHeaders) : null,
      JSON.stringify(profile.models || []),
      profile.keyId || null,
      profile.isActive ? 1 : 0,
      profile.createdAt,
      profile.updatedAt
    );
  }

  public listProfiles(providerId?: string): ProviderProfileRecord[] {
    let stmt;
    let rows: Record<string, unknown>[];
    if (providerId) {
      stmt = this.db.prepare(`SELECT * FROM provider_profiles WHERE provider_id = ? ORDER BY created_at DESC`);
      rows = stmt.all(providerId) as Record<string, unknown>[];
    } else {
      stmt = this.db.prepare(`SELECT * FROM provider_profiles ORDER BY provider_id, created_at DESC`);
      rows = stmt.all() as Record<string, unknown>[];
    }

    return rows.map((r) => ({
      id: r.id as string,
      providerId: r.provider_id as string,
      name: r.name as string,
      baseUrl: (r.base_url as string) || undefined,
      authType: (r.auth_type as 'bearer' | 'api-key') || 'bearer',
      customHeaders: r.custom_headers_json ? JSON.parse(r.custom_headers_json as string) : undefined,
      models: r.models_json ? JSON.parse(r.models_json as string) : [],
      keyId: (r.key_id as string) || undefined,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
  }

  public getProfile(id: string): ProviderProfileRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM provider_profiles WHERE id = ?`);
    const r = stmt.get(id) as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      id: r.id as string,
      providerId: r.provider_id as string,
      name: r.name as string,
      baseUrl: (r.base_url as string) || undefined,
      authType: (r.auth_type as 'bearer' | 'api-key') || 'bearer',
      customHeaders: r.custom_headers_json ? JSON.parse(r.custom_headers_json as string) : undefined,
      models: r.models_json ? JSON.parse(r.models_json as string) : [],
      keyId: (r.key_id as string) || undefined,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  public deleteProfile(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM provider_profiles WHERE id = ?`);
    stmt.run(id);
  }

  public setActiveProfile(id: string, providerId: string): void {
    const reset = this.db.prepare(`UPDATE provider_profiles SET is_active = 0 WHERE provider_id = ?`);
    reset.run(providerId);
    const set = this.db.prepare(`UPDATE provider_profiles SET is_active = 1, updated_at = ? WHERE id = ?`);
    set.run(new Date().toISOString(), id);
  }

  public savePreset(preset: ModelPresetRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO model_presets (id, alias, name, provider_id, model_id, description, is_default, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      preset.id,
      preset.alias.toLowerCase(),
      preset.name,
      preset.providerId,
      preset.modelId,
      preset.description,
      preset.isDefault ? 1 : 0,
      preset.updatedAt
    );
  }

  public listPresets(): ModelPresetRecord[] {
    const stmt = this.db.prepare(`SELECT * FROM model_presets ORDER BY alias ASC`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      alias: r.alias as string,
      name: r.name as string,
      providerId: r.provider_id as string,
      modelId: r.model_id as string,
      description: r.description as string,
      isDefault: Boolean(r.is_default),
      updatedAt: r.updated_at as string,
    }));
  }

  public getPresetByAlias(alias: string): ModelPresetRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM model_presets WHERE alias = ?`);
    const r = stmt.get(alias.toLowerCase()) as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      id: r.id as string,
      alias: r.alias as string,
      name: r.name as string,
      providerId: r.provider_id as string,
      modelId: r.model_id as string,
      description: r.description as string,
      isDefault: Boolean(r.is_default),
      updatedAt: r.updated_at as string,
    };
  }

  public saveWorkspace(ws: WorkspaceRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO workspaces (id, name, path, default_provider_id, default_model_id, system_instructions, context_paths_json, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      ws.id,
      ws.name,
      ws.path,
      ws.defaultProviderId,
      ws.defaultModelId,
      ws.systemInstructions || null,
      JSON.stringify(ws.contextPaths || []),
      ws.isActive ? 1 : 0,
      ws.createdAt,
      ws.updatedAt
    );
  }

  public listWorkspaces(): WorkspaceRecord[] {
    const stmt = this.db.prepare(`SELECT * FROM workspaces ORDER BY updated_at DESC`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      path: r.path as string,
      defaultProviderId: r.default_provider_id as string,
      defaultModelId: r.default_model_id as string,
      systemInstructions: (r.system_instructions as string) || undefined,
      contextPaths: r.context_paths_json ? JSON.parse(r.context_paths_json as string) : [],
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
  }

  public getWorkspace(id: string): WorkspaceRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM workspaces WHERE id = ?`);
    const r = stmt.get(id) as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      id: r.id as string,
      name: r.name as string,
      path: r.path as string,
      defaultProviderId: r.default_provider_id as string,
      defaultModelId: r.default_model_id as string,
      systemInstructions: (r.system_instructions as string) || undefined,
      contextPaths: r.context_paths_json ? JSON.parse(r.context_paths_json as string) : [],
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  public getActiveWorkspace(): WorkspaceRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM workspaces WHERE is_active = 1 LIMIT 1`);
    const r = stmt.get() as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      id: r.id as string,
      name: r.name as string,
      path: r.path as string,
      defaultProviderId: r.default_provider_id as string,
      defaultModelId: r.default_model_id as string,
      systemInstructions: (r.system_instructions as string) || undefined,
      contextPaths: r.context_paths_json ? JSON.parse(r.context_paths_json as string) : [],
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  public setActiveWorkspace(id: string): void {
    this.db.prepare(`UPDATE workspaces SET is_active = 0`).run();
    this.db.prepare(`UPDATE workspaces SET is_active = 1, updated_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      id
    );
  }

  public deleteWorkspace(id: string): void {
    this.db.prepare(`DELETE FROM workspaces WHERE id = ?`).run(id);
  }

  public logUsage(record: UsageRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO usage_logs (timestamp, provider_id, model_id, duration_ms, input_tokens, output_tokens, total_tokens, status, error_type, cost_estimate_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.timestamp,
      record.providerId,
      record.modelId,
      record.durationMs,
      record.inputTokens,
      record.outputTokens,
      record.totalTokens,
      record.status,
      record.errorType || null,
      record.costEstimateUSD || 0
    );
  }

  public getUsageSummary(): {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUSD: number;
    byProvider: Array<{ providerId: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    byModel: Array<{ modelId: string; providerId: string; requests: number; totalTokens: number }>;
  } {
    const totalStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(input_tokens), 0) as total_input,
        COALESCE(SUM(output_tokens), 0) as total_output,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost_estimate_usd), 0) as total_cost
      FROM usage_logs
    `);
    const totalRow = totalStmt.get() as Record<string, unknown>;

    const providerStmt = this.db.prepare(`
      SELECT 
        provider_id,
        COUNT(*) as requests,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM usage_logs
      GROUP BY provider_id
      ORDER BY total_tokens DESC
    `);
    const providerRows = providerStmt.all() as Record<string, unknown>[];

    const modelStmt = this.db.prepare(`
      SELECT 
        model_id,
        provider_id,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM usage_logs
      GROUP BY model_id, provider_id
      ORDER BY total_tokens DESC
    `);
    const modelRows = modelStmt.all() as Record<string, unknown>[];

    return {
      totalRequests: Number(totalRow.total_requests || 0),
      totalInputTokens: Number(totalRow.total_input || 0),
      totalOutputTokens: Number(totalRow.total_output || 0),
      totalTokens: Number(totalRow.total_tokens || 0),
      totalCostUSD: Number(totalRow.total_cost || 0),
      byProvider: providerRows.map((r) => ({
        providerId: r.provider_id as string,
        requests: Number(r.requests),
        inputTokens: Number(r.input_tokens),
        outputTokens: Number(r.output_tokens),
        totalTokens: Number(r.total_tokens),
      })),
      byModel: modelRows.map((r) => ({
        modelId: r.model_id as string,
        providerId: r.provider_id as string,
        requests: Number(r.requests),
        totalTokens: Number(r.total_tokens),
      })),
    };
  }

  public createSession(session: SessionRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, title, provider_id, model_id, workspace_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.title,
      session.providerId,
      session.modelId,
      session.workspaceId || null,
      session.createdAt,
      session.updatedAt
    );
  }

  public listSessions(): SessionRecord[] {
    const stmt = this.db.prepare(`SELECT * FROM sessions ORDER BY updated_at DESC`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      providerId: r.provider_id as string,
      modelId: r.model_id as string,
      workspaceId: (r.workspace_id as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
  }

  public getSession(id: string): SessionRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`);
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      title: row.title as string,
      providerId: row.provider_id as string,
      modelId: row.model_id as string,
      workspaceId: (row.workspace_id as string) || undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  public saveMessage(message: MessageRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (session_id, role, content, tool_calls, tool_call_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      message.sessionId,
      message.role,
      message.content,
      message.toolCalls || null,
      message.toolCallId || null,
      message.timestamp
    );

    const updateSession = this.db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`);
    updateSession.run(message.timestamp, message.sessionId);
  }

  public getSessionMessages(sessionId: string): MessageRecord[] {
    const stmt = this.db.prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC`);
    const rows = stmt.all(sessionId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: Number(r.id),
      sessionId: r.session_id as string,
      role: r.role as 'system' | 'user' | 'assistant' | 'tool',
      content: r.content as string,
      toolCalls: (r.tool_calls as string) || undefined,
      toolCallId: (r.tool_call_id as string) || undefined,
      timestamp: r.timestamp as string,
    }));
  }

  public deleteSession(id: string): void {
    this.db.prepare(`DELETE FROM messages WHERE session_id = ?`).run(id);
    this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  }

  public updateSessionTitle(id: string, title: string): void {
    const stmt = this.db.prepare(`UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?`);
    stmt.run(title, new Date().toISOString(), id);
  }

  public updateSessionModel(id: string, providerId: string, modelId: string): void {
    const stmt = this.db.prepare(`UPDATE sessions SET provider_id = ?, model_id = ?, updated_at = ? WHERE id = ?`);
    stmt.run(providerId, modelId, new Date().toISOString(), id);
  }

  public getAllDataForExport(): {
    version: string;
    exportedAt: string;
    sessions: SessionRecord[];
    messages: MessageRecord[];
    usage: UsageRecord[];
    profiles: ProviderProfileRecord[];
    presets: ModelPresetRecord[];
    workspaces: WorkspaceRecord[];
    config: Record<string, string>;
    secrets: EncryptedSecretRecord[];
  } {
    const sessions = this.listSessions();
    const allMessages = (this.db.prepare(`SELECT * FROM messages`).all() as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      sessionId: r.session_id as string,
      role: r.role as 'system' | 'user' | 'assistant' | 'tool',
      content: r.content as string,
      toolCalls: (r.tool_calls as string) || undefined,
      toolCallId: (r.tool_call_id as string) || undefined,
      timestamp: r.timestamp as string,
    }));
    const usageLogs = (this.db.prepare(`SELECT * FROM usage_logs ORDER BY timestamp DESC`).all() as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      timestamp: r.timestamp as string,
      providerId: r.provider_id as string,
      modelId: r.model_id as string,
      durationMs: Number(r.duration_ms),
      inputTokens: Number(r.input_tokens),
      outputTokens: Number(r.output_tokens),
      totalTokens: Number(r.total_tokens),
      status: r.status as 'success' | 'error',
      errorType: (r.error_type as string) || undefined,
      costEstimateUSD: Number(r.cost_estimate_usd || 0),
    }));
    const configRows = this.db.prepare(`SELECT * FROM app_config`).all() as Record<string, unknown>[];
    const config: Record<string, string> = {};
    for (const row of configRows) {
      config[row.key as string] = row.value as string;
    }
    const secretRows = (this.db.prepare(`SELECT * FROM secrets`).all() as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      providerId: row.provider_id as string,
      name: row.name as string,
      maskedKey: row.masked_key as string,
      ciphertext: row.ciphertext as string,
      iv: row.iv as string,
      authTag: row.auth_tag as string,
      salt: row.salt as string,
      createdAt: row.created_at as string,
      lastUsedAt: (row.last_used_at as string) || undefined,
    }));

    return {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      sessions,
      messages: allMessages,
      usage: usageLogs,
      profiles: this.listProfiles(),
      presets: this.listPresets(),
      workspaces: this.listWorkspaces(),
      config,
      secrets: secretRows,
    };
  }

  public importAllData(data: {
    sessions?: SessionRecord[];
    messages?: MessageRecord[];
    usage?: UsageRecord[];
    profiles?: ProviderProfileRecord[];
    presets?: ModelPresetRecord[];
    workspaces?: WorkspaceRecord[];
    config?: Record<string, string>;
    secrets?: EncryptedSecretRecord[];
  }): void {
    if (data.secrets && Array.isArray(data.secrets)) {
      for (const secret of data.secrets) {
        this.saveSecret(secret);
      }
    }
    if (data.profiles && Array.isArray(data.profiles)) {
      for (const profile of data.profiles) {
        this.saveProfile(profile);
      }
    }
    if (data.presets && Array.isArray(data.presets)) {
      for (const preset of data.presets) {
        this.savePreset(preset);
      }
    }
    if (data.workspaces && Array.isArray(data.workspaces)) {
      for (const ws of data.workspaces) {
        this.saveWorkspace(ws);
      }
    }
    if (data.sessions && Array.isArray(data.sessions)) {
      for (const s of data.sessions) {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO sessions (id, title, provider_id, model_id, workspace_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(s.id, s.title, s.providerId, s.modelId, s.workspaceId || null, s.createdAt, s.updatedAt);
      }
    }
    if (data.messages && Array.isArray(data.messages)) {
      for (const m of data.messages) {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO messages (id, session_id, role, content, tool_calls, tool_call_id, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(m.id || null, m.sessionId, m.role, m.content, m.toolCalls || null, m.toolCallId || null, m.timestamp);
      }
    }
    if (data.config && typeof data.config === 'object') {
      for (const [k, v] of Object.entries(data.config)) {
        this.setConfig(k, v);
      }
    }
  }

  public setConfig(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, value, new Date().toISOString());
  }

  public getConfig(key: string): string | null {
    const stmt = this.db.prepare(`SELECT value FROM app_config WHERE key = ?`);
    const row = stmt.get(key) as Record<string, unknown> | undefined;
    return row ? (row.value as string) : null;
  }

  public close(): void {
    this.db.close();
  }
}
