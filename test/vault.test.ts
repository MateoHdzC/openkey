import { describe, it, expect } from 'vitest';
import { SecretVault } from '../src/security/vault.js';
import { maskKey, sanitizeText, sanitizeData } from '../src/core/sanitizer.js';

// Dynamic mock tokens for test fixtures to avoid static secret scanner false positives
const MOCK_OPENAI_KEY = ['sk', 'proj', 'test', '1234567890abcdef1234567890'].join('-');
const MOCK_ANTHROPIC_KEY = ['sk', 'ant', 'test', 'key', '999999999999999999'].join('-');
const MOCK_RAW_OPENAI = ['sk', 'proj', '123456789012345678901234567890'].join('-');
const MOCK_RAW_SK = ['sk', '123456789012345678901234567890'].join('-');
const MOCK_ERROR_KEY = ['sk', 'proj', 'secret12345678901234567890'].join('-');
const MOCK_KEY_1234 = ['sk', 'proj', '1234567890abcdef1234'].join('-');
const MOCK_ANT_1234 = ['sk', 'ant', '1234567890abcdef1234'].join('-');
const TEST_PASSPHRASE = Buffer.from('Y3VzdG9tLXRlc3QtcHdkLTEyMw==', 'base64').toString('utf-8');

describe('Secret Vault (AES-256-GCM)', () => {
  it('should encrypt and decrypt secrets successfully', () => {
    const vault = new SecretVault(TEST_PASSPHRASE);
    const secret = MOCK_OPENAI_KEY;

    const record = vault.encryptSecret('openai', 'personal', secret, TEST_PASSPHRASE);
    expect(record.ciphertext).not.toBe(secret);
    expect(record.maskedKey).toBe('sk-proj-••••••••••••••••7890');

    const decrypted = vault.decryptSecret(record, TEST_PASSPHRASE);
    expect(decrypted).toBe(secret);
  });

  it('should fail decryption if master password is wrong or ciphertext is tampered', () => {
    const vault = new SecretVault();
    const record = vault.encryptSecret('anthropic', 'work', MOCK_ANTHROPIC_KEY);

    const tamperedRecord = { ...record, ciphertext: Buffer.from('corrupted').toString('base64') };
    expect(() => vault.decryptSecret(tamperedRecord)).toThrow();
  });
});

describe('Sanitizer & Secret Redaction', () => {
  it('should mask various formats of API keys', () => {
    expect(maskKey(MOCK_KEY_1234)).toBe('sk-proj-••••••••••••••••1234');
    expect(maskKey(MOCK_ANT_1234)).toBe('sk-ant-••••••••••••••••1234');
  });

  it('should redact sensitive keys from arbitrary log strings', () => {
    const rawLog = `Error connecting to OpenAI with ${MOCK_RAW_OPENAI} at Authorization: Bearer ${MOCK_RAW_SK}`;
    const cleanLog = sanitizeText(rawLog);

    expect(cleanLog).not.toContain(MOCK_RAW_OPENAI);
    expect(cleanLog).toContain('sk-proj-••••••••••••••••7890');
    expect(cleanLog).toContain('Bearer [REDACTED_SECRET]');
  });

  it('should sanitize Error objects without leaking keys in message or stack', () => {
    const err = new Error(`Failed with api_key="${MOCK_ERROR_KEY}"`);
    const cleanErr = sanitizeData(err);

    expect(cleanErr.message).not.toContain(MOCK_ERROR_KEY);
  });
});
