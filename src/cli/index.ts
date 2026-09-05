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
    .command('update')
    .alias('upgrade')
    .description('Check for updates and upgrade OpenKey to the latest version')
    .option('-c, --check', 'Check for updates without installing')
    .action(async (options) => {
      console.log(chalk.cyan.bold('\n🔄 OpenKey Update Manager\n'));
      const updater = new UpdateManager();

      try {
        console.log(chalk.gray('Checking remote repository status...'));
        const check = await updater.checkForUpdates();

        console.log(`Current version / commit: ${chalk.bold(check.currentCommit)}`);
        console.log(`Latest on origin/main:     ${chalk.bold.green(check.latestCommit)}`);
        console.log(`Latest commit message:     ${chalk.italic(check.latestMessage)}`);
        console.log(`Repository:                ${chalk.blue(check.repoUrl)}\n`);

        if (!check.hasUpdate) {
          console.log(chalk.green('✓ OpenKey is already up to date!\n'));
          return;
        }

        if (options.check) {
          console.log(chalk.yellow('⚡ An update is available. Run `openkey update` to install.\n'));
          return;
        }

        console.log(chalk.yellow('🚀 Applying latest updates...'));
        const result = await updater.applyUpdate((step) => {
          console.log(`  ${chalk.cyan('›')} ${step}`);
        });

        if (result.success) {
          console.log(chalk.green.bold(`\n✓ OpenKey upgraded successfully to commit ${result.updatedCommit}!\n`));
        } else {
          console.log(chalk.red.bold(`\n✗ Update failed: ${result.error || 'Unknown error'}\n`));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(chalk.red(`\n✗ Error communicating with repository: ${msg}\n`));
      }
    });

  return program;
}
