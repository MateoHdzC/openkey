import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import type { EncryptedSecretRecord, StoredSecretMeta } from '../security/vault.js';

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
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
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
      INSERT INTO sessions (id, title, provider_id, model_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(session.id, session.title, session.providerId, session.modelId, session.createdAt, session.updatedAt);
  }

  public listSessions(): SessionRecord[] {
    const stmt = this.db.prepare(`SELECT * FROM sessions ORDER BY updated_at DESC`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      providerId: r.provider_id as string,
      modelId: r.model_id as string,
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
    config: Record<string, string>;
    secretsMeta: StoredSecretMeta[];
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
    const secretsMeta = this.listSecretsMeta();

    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      sessions,
      messages: allMessages,
      usage: usageLogs,
      config,
      secretsMeta,
    };
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
