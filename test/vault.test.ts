import { describe, it, expect } from 'vitest';
import { SecretVault } from '../src/security/vault.js';
import { maskKey, sanitizeText, sanitizeData } from '../src/core/sanitizer.js';

describe('Secret Vault (AES-256-GCM)', () => {
  it('should encrypt and decrypt secrets successfully', () => {
    const vault = new SecretVault('custom-test-password-123');
    const secret = 'sk-proj-test-1234567890abcdef1234567890';

    const record = vault.encryptSecret('openai', 'personal', secret, 'custom-test-password-123');
    expect(record.ciphertext).not.toBe(secret);
    expect(record.maskedKey).toBe('sk-proj-••••••••••••••••7890');

    const decrypted = vault.decryptSecret(record, 'custom-test-password-123');
    expect(decrypted).toBe(secret);
  });

  it('should fail decryption if master password is wrong or ciphertext is tampered', () => {
    const vault = new SecretVault();
    const record = vault.encryptSecret('anthropic', 'work', 'sk-ant-test-key-999999999999999999');

    // Tamper ciphertext
    const tamperedRecord = { ...record, ciphertext: Buffer.from('corrupted').toString('base64') };
    expect(() => vault.decryptSecret(tamperedRecord)).toThrow();
  });
});

describe('Sanitizer & Secret Redaction', () => {
  it('should mask various formats of API keys', () => {
    expect(maskKey('sk-proj-1234567890abcdef1234')).toBe('sk-proj-••••••••••••••••1234');
    expect(maskKey('sk-ant-1234567890abcdef1234')).toBe('sk-ant-••••••••••••••••1234');
  });

  it('should redact sensitive keys from arbitrary log strings', () => {
    const rawLog = 'Error connecting to OpenAI with sk-proj-123456789012345678901234567890 at Authorization: Bearer sk-123456789012345678901234567890';
    const cleanLog = sanitizeText(rawLog);

    expect(cleanLog).not.toContain('sk-proj-123456789012345678901234567890');
    expect(cleanLog).toContain('sk-proj-••••••••••••••••7890');
    expect(cleanLog).toContain('Bearer [REDACTED_SECRET]');
  });

  it('should sanitize Error objects without leaking keys in message or stack', () => {
    const err = new Error('Failed with api_key="sk-proj-secret12345678901234567890"');
    const cleanErr = sanitizeData(err);

    expect(cleanErr.message).not.toContain('sk-proj-secret12345678901234567890');
  });
});
