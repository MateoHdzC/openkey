import { StorageDatabase } from '../storage/db.js';
import { SecretVault } from '../security/vault.js';
import { ConfigManager } from './config.js';
import { ProviderRegistry } from '../providers/registry.js';
import { ToolRuntime } from '../tools/runtime.js';
import fs from 'node:fs';
import path from 'node:path';

export interface DoctorCheckResult {
  category: string;
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export class SystemDoctor {
  private db: StorageDatabase;
  private vault: SecretVault;
  private configManager: ConfigManager;
  private registry: ProviderRegistry;
  private tools: ToolRuntime;

  constructor() {
    this.db = new StorageDatabase();
    this.vault = new SecretVault();
    this.configManager = new ConfigManager(this.db);
    this.registry = new ProviderRegistry(this.configManager, this.db, this.vault);
    this.tools = new ToolRuntime();
  }

  public async runAllChecks(workspaceRoot: string = process.cwd()): Promise<DoctorCheckResult[]> {
    const results: DoctorCheckResult[] = [];

    try {
      const config = this.configManager.getConfig();
      results.push({
        category: 'Configuration',
        name: 'Config Store',
        status: 'ok',
        message: `Active provider: ${config.activeProviderId}, Active model: ${config.activeModelId}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: 'Configuration',
        name: 'Config Store',
        status: 'error',
        message: `Config error: ${msg}`,
      });
    }

    try {
      const testEnc = this.vault.encryptSecret('test', 'test-key', 'sk-test-sample-secret-12345');
      const testDec = this.vault.decryptSecret(testEnc);
      if (testDec === 'sk-test-sample-secret-12345') {
        results.push({
          category: 'Security',
          name: 'Secure Vault (AES-256-GCM)',
          status: 'ok',
          message: 'Authenticated cryptographic vault functioning normally',
        });
      } else {
        throw new Error('Decrypted content mismatch');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: 'Security',
        name: 'Secure Vault (AES-256-GCM)',
        status: 'error',
        message: `Vault verification failed: ${msg}`,
      });
    }

    try {
      const secrets = this.db.listSecretsMeta();
      results.push({
        category: 'Storage',
        name: 'SQLite Database',
        status: 'ok',
        message: `Storage active with ${secrets.length} configured secret(s)`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: 'Storage',
        name: 'SQLite Database',
        status: 'error',
        message: `Database error: ${msg}`,
      });
    }

    try {
      const providers = this.registry.listProviders();
      const activeProvider = this.configManager.getConfig().activeProviderId;
      const secrets = this.db.getSecretsByProvider(activeProvider);

      results.push({
        category: 'Providers',
        name: 'Provider Registry',
        status: 'ok',
        message: `${providers.length} providers loaded (${providers.map((p) => p.name).join(', ')})`,
      });

      if (activeProvider !== 'ollama' && secrets.length === 0) {
        results.push({
          category: 'Providers',
          name: `Active Provider Credentials (${activeProvider})`,
          status: 'warn',
          message: `No API Key configured for active provider "${activeProvider}". Run "/connect" to add one.`,
        });
      } else {
        results.push({
          category: 'Providers',
          name: `Active Provider Credentials (${activeProvider})`,
          status: 'ok',
          message: `Credentials configured (${secrets[0]?.maskedKey || 'local daemon'})`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: 'Providers',
        name: 'Provider Setup',
        status: 'error',
        message: msg,
      });
    }

    try {
      const toolDefs = this.tools.getDefinitions();
      results.push({
        category: 'Tools',
        name: 'Tool Runtime',
        status: 'ok',
        message: `${toolDefs.length} builtin tools registered (${toolDefs.map((t) => t.name).join(', ')})`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: 'Tools',
        name: 'Tool Runtime',
        status: 'error',
        message: msg,
      });
    }

    try {
      const resolved = path.resolve(workspaceRoot);
      const isDir = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
      if (isDir) {
        results.push({
          category: 'Workspace',
          name: 'Project Workspace',
          status: 'ok',
          message: `Valid directory: ${resolved}`,
        });
      } else {
        results.push({
          category: 'Workspace',
          name: 'Project Workspace',
          status: 'error',
          message: `Workspace path is not a directory: ${resolved}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: 'Workspace',
        name: 'Project Workspace',
        status: 'error',
        message: msg,
      });
    }

    return results;
  }
}
