import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { App } from '../tui/App.js';
import { StorageDatabase } from '../storage/db.js';
import { ConfigManager } from '../core/config.js';
import { ProviderRegistry } from '../providers/registry.js';
import { SystemDoctor } from '../core/doctor.js';
import { startLocalWebServer } from '../web/server.js';
import { UpdateManager } from '../core/updater.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('openkey')
    .description('Universal AI API Key Manager and Terminal Agent')
    .version('1.0.0');

  program.action(async () => {
    const config = new ConfigManager();
    const port = config.getConfig().webPort || 3000;
    try {
      await startLocalWebServer(port, true);
    } catch {
    }
    render(React.createElement(App, { initialMode: 'chat', webUrl: `http://127.0.0.1:${port}` }));
  });

  program
    .command('connect')
    .description('Open interactive provider and API key manager')
    .action(async () => {
      const config = new ConfigManager();
      const port = config.getConfig().webPort || 3000;
      try {
        await startLocalWebServer(port, true);
      } catch {}
      render(React.createElement(App, { initialMode: 'connect', webUrl: `http://127.0.0.1:${port}` }));
    });

  program
    .command('sessions')
    .description('Manage and resume saved conversation sessions')
    .action(async () => {
      const config = new ConfigManager();
      const port = config.getConfig().webPort || 3000;
      try {
        await startLocalWebServer(port, true);
      } catch {}
      render(React.createElement(App, { initialMode: 'chat', webUrl: `http://127.0.0.1:${port}` }));
    });

  program
    .command('models')
    .description('List configured and discovered AI models')
    .action(async () => {
      console.log(chalk.cyan.bold('\n🧠 OpenKey Model Catalog\n'));
      const db = new StorageDatabase();
      const config = new ConfigManager(db);
      const registry = new ProviderRegistry(config, db);

      const active = config.getActiveModelSelection();
      console.log(chalk.yellow(`Active Selection: ${active.providerId.toUpperCase()} / ${active.modelId}\n`));

      const providers = registry.listProviders();
      for (const p of providers) {
        console.log(chalk.bold.green(`[${p.name}]`));
        try {
          const models = await registry.discoverModels(p.id);
          for (const m of models) {
            const isCurrent = p.id === active.providerId && m.id === active.modelId;
            const marker = isCurrent ? chalk.green('● (active)') : chalk.gray('○');
            const reasoning = m.capabilities.reasoning ? chalk.magenta(' [Reasoning]') : '';
            const vision = m.capabilities.vision ? chalk.blue(' [Vision]') : '';
            console.log(`  ${marker} ${m.name} (${m.id})${reasoning}${vision}`);
          }
        } catch {
          console.log(chalk.gray('  (No credentials configured)'));
        }
        console.log('');
      }
    });

  program
    .command('usage')
    .description('Display token consumption and statistics')
    .action(() => {
      const db = new StorageDatabase();
      const summary = db.getUsageSummary();

      console.log(chalk.yellow.bold('\n📊 OpenKey Usage Statistics\n'));
      console.log(`Total Requests:  ${chalk.bold(summary.totalRequests.toLocaleString())}`);
      console.log(`Input Tokens:    ${chalk.cyan(summary.totalInputTokens.toLocaleString())}`);
      console.log(`Output Tokens:   ${chalk.cyan(summary.totalOutputTokens.toLocaleString())}`);
      console.log(`Total Tokens:    ${chalk.green.bold(summary.totalTokens.toLocaleString())}\n`);

      if (summary.byProvider.length > 0) {
        console.log(chalk.bold('Usage by Provider:'));
        for (const p of summary.byProvider) {
          console.log(
            `  • ${p.providerId.toUpperCase().padEnd(12)} ${p.requests.toString().padStart(4)} reqs | ${chalk.green(
              p.totalTokens.toLocaleString().padStart(10)
            )} tokens`
          );
        }
      }
      console.log('');
    });

  program
    .command('doctor')
    .description('Run system, security, and provider health checks')
    .action(async () => {
      console.log(chalk.cyan.bold('\n🩺 Running OpenKey System Doctor...\n'));
      const doctor = new SystemDoctor();
      const checks = await doctor.runAllChecks();

      for (const check of checks) {
        let badge = chalk.green('✓');
        if (check.status === 'warn') badge = chalk.yellow('⚠');
        if (check.status === 'error') badge = chalk.red('✗');

        console.log(
          `${badge} ${chalk.bold(`[${check.category}]`)} ${check.name}: ${
            check.status === 'error' ? chalk.red(check.message) : check.message
          }`
        );
      }
      console.log('');
    });

  program
    .command('web')
    .description('Launch local-first Web UI on http://127.0.0.1:3000')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .action(async (options) => {
      const port = parseInt(options.port, 10) || 3000;
      await startLocalWebServer(port);
    });

  program
    .command('proxy')
    .description('Run local OpenAI-compatible universal proxy gateway')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .action(async (options) => {
      const port = parseInt(options.port, 10) || 3000;
      console.log(chalk.blue.bold('\n⚡ OpenKey Universal OpenAI-Compatible Proxy Gateway'));
      console.log(chalk.gray(`Base URL: http://127.0.0.1:${port}/v1`));
      console.log(chalk.gray(`Endpoints: POST /v1/chat/completions, GET /v1/models`));
      console.log(chalk.cyan(`Aliases supported: coding, fast, reasoning, cheap, quality\n`));
      await startLocalWebServer(port);
    });

  program
    .command('presets')
    .description('List and manage intelligent model presets')
    .action(() => {
      const db = new StorageDatabase();
      const presets = db.listPresets();
      console.log(chalk.cyan.bold('\n⚡ OpenKey Model Presets\n'));
      for (const p of presets) {
        console.log(
          `  • ${chalk.bold.yellow(p.alias.padEnd(12))} -> ${chalk.green(p.providerId.toUpperCase())} / ${chalk.bold(
            p.modelId
          )}`
        );
        console.log(`    ${chalk.gray(p.description)}\n`);
      }
    });

  program
    .command('profiles')
    .description('List and manage AI provider profiles')
    .action(() => {
      const db = new StorageDatabase();
      const profiles = db.listProfiles();
      console.log(chalk.cyan.bold('\n📁 OpenKey Provider Profiles\n'));
      if (profiles.length === 0) {
        console.log(chalk.gray('  No custom profiles saved yet. Use Web Studio or API to add profiles.\n'));
        return;
      }
      for (const pr of profiles) {
        const activeMarker = pr.isActive ? chalk.green('● (active)') : chalk.gray('○');
        console.log(`  ${activeMarker} ${chalk.bold(pr.name)} [${pr.providerId.toUpperCase()}]`);
        if (pr.baseUrl) console.log(`    Base URL: ${chalk.gray(pr.baseUrl)}`);
        if (pr.models.length > 0) console.log(`    Models:   ${chalk.gray(pr.models.join(', '))}`);
        console.log('');
      }
    });

  program
    .command('workspaces')
    .description('List and switch project workspaces')
    .action(() => {
      const db = new StorageDatabase();
      const workspaces = db.listWorkspaces();
      console.log(chalk.cyan.bold('\n🏢 OpenKey Workspaces\n'));
      for (const ws of workspaces) {
        const activeMarker = ws.isActive ? chalk.green('● (active)') : chalk.gray('○');
        console.log(`  ${activeMarker} ${chalk.bold(ws.name)}`);
        console.log(`    Path:     ${chalk.gray(ws.path)}`);
        console.log(`    Default:  ${chalk.cyan(`${ws.defaultProviderId} / ${ws.defaultModelId}`)}\n`);
      }
    });

  program
    .command('export')
    .description('Export encrypted backup archive of all credentials, sessions, and configurations')
    .option('-o, --output <file>', 'Output file path', 'openkey-backup.json')
    .option('-p, --password <password>', 'Encryption password (required)')
    .action(async (options) => {
      const password = options.password;
      if (!password || password.length < 4) {
        console.log(chalk.red('\n✗ Error: Must provide --password with at least 4 characters.\n'));
        return;
      }
      const db = new StorageDatabase();
      const vault = new (await import('../security/vault.js')).SecretVault();
      const data = db.getAllDataForExport();
      const envelope = vault.exportEncryptedArchive(data, password);
      const fs = await import('node:fs');
      fs.writeFileSync(options.output, JSON.stringify(envelope, null, 2), 'utf8');
      console.log(chalk.green.bold(`\n✓ Exported encrypted backup archive to: ${options.output}\n`));
    });

  program
    .command('import')
    .description('Import and restore an encrypted backup archive')
    .argument('<file>', 'Path to encrypted archive JSON file')
    .option('-p, --password <password>', 'Decryption password (required)')
    .action(async (file, options) => {
      const password = options.password;
      if (!password) {
        console.log(chalk.red('\n✗ Error: Must provide --password to decrypt archive.\n'));
        return;
      }
      const fs = await import('node:fs');
      if (!fs.existsSync(file)) {
        console.log(chalk.red(`\n✗ Error: File ${file} does not exist.\n`));
        return;
      }
      const raw = fs.readFileSync(file, 'utf8');
      const envelope = JSON.parse(raw);
      const db = new StorageDatabase();
      const vault = new (await import('../security/vault.js')).SecretVault();
      try {
        const data = vault.importEncryptedArchive<Record<string, unknown>>(envelope, password);
        db.importAllData(data);
        console.log(chalk.green.bold('\n✓ Backup archive decrypted and restored successfully into OpenKey!\n'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(chalk.red.bold(`\n✗ Import failed: ${msg}\n`));
      }
    });

  return program;
}
