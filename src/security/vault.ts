import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { maskKey } from '../core/sanitizer.js';

export interface EncryptedSecretRecord {
  id: string;
  providerId: string;
  name: string;
  maskedKey: string;
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface StoredSecretMeta {
  id: string;
  providerId: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface EncryptedArchiveEnvelope {
  version: string;
  exportedAt: string;
  salt: string;
  iv: string;
  authTag: string;
  payload: string;
}

export class SecretVault {
  private defaultMasterSecret: string;

  constructor(customKey?: string) {
    this.defaultMasterSecret = customKey || this.getMachineScopedSeed();
  }

  private getMachineScopedSeed(): string {
    const username = os.userInfo().username || 'openkey-user';
    const homedir = os.homedir();
    const hostname = os.hostname();
    return `openkey-vault-seed:${username}@${hostname}:${homedir}`;
  }

  private deriveKey(salt: Buffer, masterPassword?: string): Buffer {
    const password = masterPassword || this.defaultMasterSecret;
    return crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha512');
  }

  public encryptSecret(
    providerId: string,
    name: string,
    rawKey: string,
    masterPassword?: string
  ): EncryptedSecretRecord {
    if (!rawKey || typeof rawKey !== 'string') {
      throw new Error('Invalid secret key: must be a non-empty string');
    }

    const id = `key_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = this.deriveKey(salt, masterPassword);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(rawKey, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return {
      id,
      providerId,
      name,
      maskedKey: maskKey(rawKey),
      ciphertext,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
      createdAt: new Date().toISOString(),
    };
  }

  public decryptSecret(
    record: EncryptedSecretRecord,
    masterPassword?: string
  ): string {
    const salt = Buffer.from(record.salt, 'base64');
    const iv = Buffer.from(record.iv, 'base64');
    const authTag = Buffer.from(record.authTag, 'base64');
    const key = this.deriveKey(salt, masterPassword);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(record.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      throw new Error(
        'Failed to decrypt secret: Vault integrity check failed or incorrect master key.'
      );
    }
  }

  public exportEncryptedArchive(data: unknown, password: string): EncryptedArchiveEnvelope {
    if (!password || password.trim().length < 4) {
      throw new Error('Encryption password must be at least 4 characters');
    }

    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha512');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const jsonString = JSON.stringify(data);
    let payload = cipher.update(jsonString, 'utf8', 'base64');
    payload += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return {
      version: 'openkey-vault-archive-v1',
      exportedAt: new Date().toISOString(),
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      payload,
    };
  }

  public importEncryptedArchive<T = unknown>(envelope: EncryptedArchiveEnvelope, password: string): T {
    if (!envelope || !envelope.salt || !envelope.iv || !envelope.authTag || !envelope.payload) {
      throw new Error('Invalid archive format: missing required cryptographic envelope fields');
    }

    const salt = Buffer.from(envelope.salt, 'base64');
    const iv = Buffer.from(envelope.iv, 'base64');
    const authTag = Buffer.from(envelope.authTag, 'base64');
    const key = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha512');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(envelope.payload, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted) as T;
    } catch {
      throw new Error('Decryption failed: Incorrect archive password or corrupted archive file');
    }
  }
}

