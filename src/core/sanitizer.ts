/**
 * Centralized secret sanitization and log redaction layer.
 * Prevents any credential, Bearer token, or API key from leaking into
 * logs, exceptions, terminal outputs, or UI payloads.
 */

const SENSITIVE_PATTERNS: RegExp[] = [
  /\bsk-[a-zA-Z0-9_-]{20,}\b/g,
  /\bsk-proj-[a-zA-Z0-9_-]{20,}\b/g,
  /\bsk-or-v1-[a-zA-Z0-9_-]{20,}\b/g,
  /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/g,
  /\bAIzaSy[a-zA-Z0-9_-]{33}\b/g,
  /\bgsk_[a-zA-Z0-9_-]{20,}\b/g,
  /\bxai-[a-zA-Z0-9_-]{20,}\b/g,
  /Bearer\s+([a-zA-Z0-9._~+/-]+=*)/gi,
  /authorization:\s*(['"]?)(Bearer\s+)?[a-zA-Z0-9._~+/-]{16,}\1/gi,
  /(["']?(?:api[_-]?key|secret|token|password|auth[_-]?token)["']?\s*[:=]\s*["'])([^"'\s]{8,})(["'])/gi,
];

/**
 * Masks a sensitive key for display purposes only.
 * Example: "sk-proj-1234567890abcdef1234" -> "sk-proj-••••••••••••1234"
 */
export function maskKey(key: string): string {
  if (!key || typeof key !== 'string') return '••••';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  
  let prefix = '';
  if (trimmed.startsWith('sk-proj-')) prefix = 'sk-proj-';
  else if (trimmed.startsWith('sk-ant-')) prefix = 'sk-ant-';
  else if (trimmed.startsWith('sk-or-v1-')) prefix = 'sk-or-';
  else if (trimmed.startsWith('sk-')) prefix = 'sk-';
  else prefix = trimmed.slice(0, 4);

  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}

/**
 * Sanitizes arbitrary text by replacing any detected API keys,
 * passwords, or bearer tokens with redacted placeholders.
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return input;
  let sanitized = input;

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, (match, ...groups) => {
      if (groups.length >= 3 && typeof groups[0] === 'string' && typeof groups[1] === 'string') {
        const prefix = groups[0];
        const value = groups[1];
        const suffix = groups[2] || '';
        return `${prefix}${maskKey(value)}${suffix}`;
      }
      if (match.toLowerCase().startsWith('bearer ')) {
        return 'Bearer [REDACTED_SECRET]';
      }
      return maskKey(match);
    });
  }

  return sanitized;
}

/**
 * Recursively deep-sanitizes an object, error, or array, creating a safe clone.
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    return sanitizeText(data) as unknown as T;
  }

  if (data instanceof Error) {
    const safeError = new Error(sanitizeText(data.message));
    safeError.name = data.name;
    if (data.stack) {
      safeError.stack = sanitizeText(data.stack);
    }
    return safeError as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('token')
      ) {
        if (typeof val === 'string') {
          result[key] = maskKey(val);
        } else {
          result[key] = '[REDACTED]';
        }
      } else {
        result[key] = sanitizeData(val);
      }
    }
    return result as unknown as T;
  }

  return data;
}
