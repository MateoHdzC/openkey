import crypto from 'node:crypto';

export type UserRole = 'admin' | 'developer' | 'readonly' | 'service';

export const ROLE_DEFAULT_SCOPES: Record<UserRole, string[]> = {
  admin: ['*'],
  developer: ['chat:completions', 'models:read', 'embeddings:create', 'tools:execute'],
  readonly: ['models:read', 'usage:read'],
  service: ['chat:completions', 'models:read'],
};

export interface VirtualApiKeyRecord {
  id: string;
  name: string;
  keyHash: string;
  prefix: string;
  role: UserRole;
  scopes: string[];
  allowedModels: string[]; // ['*'] or specific model IDs
  rateLimitRpm?: number;
  dailyTokenBudget?: number;
  tokensUsedToday: number;
  budgetResetDate: string; // YYYY-MM-DD
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface CreateKeyOptions {
  name: string;
  role?: UserRole;
  scopes?: string[];
  allowedModels?: string[];
  rateLimitRpm?: number;
  dailyTokenBudget?: number;
  expiresInDays?: number;
}

export class RbacManager {
  private readonly recentRequests = new Map<string, number[]>(); // keyId -> timestamps in ms

  static hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  static generateKey(options: CreateKeyOptions): { record: VirtualApiKeyRecord; rawKey: string } {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const rawKey = `ok-live-${rawSecret}`;
    const keyHash = RbacManager.hashKey(rawKey);
    const prefix = `ok-live-${rawSecret.substring(0, 6)}...${rawSecret.substring(rawSecret.length - 4)}`;

    const role = options.role || 'developer';
    const scopes = options.scopes && options.scopes.length > 0 ? options.scopes : ROLE_DEFAULT_SCOPES[role];
    const allowedModels = options.allowedModels && options.allowedModels.length > 0 ? options.allowedModels : ['*'];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let expiresAt: string | undefined;
    if (options.expiresInDays && options.expiresInDays > 0) {
      const exp = new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000);
      expiresAt = exp.toISOString();
    }

    const record: VirtualApiKeyRecord = {
      id: `vkey_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: options.name.trim(),
      keyHash,
      prefix,
      role,
      scopes,
      allowedModels,
      rateLimitRpm: options.rateLimitRpm,
      dailyTokenBudget: options.dailyTokenBudget,
      tokensUsedToday: 0,
      budgetResetDate: todayStr,
      isActive: true,
      expiresAt,
      createdAt: now.toISOString(),
    };

    return { record, rawKey };
  }

  static hasScope(key: VirtualApiKeyRecord, requiredScope: string): boolean {
    if (!key.isActive) return false;
    if (key.scopes.includes('*')) return true;
    if (key.scopes.includes(requiredScope)) return true;

    // Support wildcard prefix e.g. "chat:*" matches "chat:completions"
    const [scopeCategory] = requiredScope.split(':');
    if (key.scopes.includes(`${scopeCategory}:*`)) return true;

    return false;
  }

  static isModelAllowed(key: VirtualApiKeyRecord, modelId: string): boolean {
    if (!key.isActive) return false;
    if (key.allowedModels.includes('*')) return true;

    const lowerTarget = modelId.toLowerCase();
    return key.allowedModels.some((m) => {
      const lower = m.toLowerCase();
      if (lower === lowerTarget) return true;
      if (lower.endsWith('*')) {
        const prefix = lower.slice(0, -1);
        return lowerTarget.startsWith(prefix);
      }
      return false;
    });
  }

  static isExpired(key: VirtualApiKeyRecord, now: Date = new Date()): boolean {
    if (!key.expiresAt) return false;
    return new Date(key.expiresAt).getTime() <= now.getTime();
  }

  checkRateLimit(key: VirtualApiKeyRecord, now: number = Date.now()): { allowed: boolean; retryAfterSeconds?: number } {
    if (!key.rateLimitRpm || key.rateLimitRpm <= 0) {
      return { allowed: true };
    }

    const windowMs = 60 * 1000;
    let timestamps = this.recentRequests.get(key.id) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= key.rateLimitRpm) {
      const oldest = timestamps[0];
      const retryAfterMs = Math.max(1000, windowMs - (now - oldest));
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    timestamps.push(now);
    this.recentRequests.set(key.id, timestamps);
    return { allowed: true };
  }

  static checkTokenBudget(key: VirtualApiKeyRecord, estimatedTokens: number = 0): { allowed: boolean; remaining: number } {
    if (!key.dailyTokenBudget || key.dailyTokenBudget <= 0) {
      return { allowed: true, remaining: Infinity };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const used = key.budgetResetDate === todayStr ? key.tokensUsedToday : 0;
    const remaining = Math.max(0, key.dailyTokenBudget - used);

    if (used + estimatedTokens > key.dailyTokenBudget) {
      return { allowed: false, remaining };
    }

    return { allowed: true, remaining };
  }
}
