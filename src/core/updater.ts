import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentCommit: string;
  latestCommit: string;
  latestMessage: string;
  latestAuthor: string;
  latestDate: string;
  isGitRepo: boolean;
  repoUrl: string;
}

export interface UpdateApplyResult {
  success: boolean;
  previousCommit: string;
  updatedCommit: string;
  output: string;
  error?: string;
}

export class UpdateManager {
  private repoOwner: string = 'MateoHdzC';
  private repoName: string = 'openkey';
  private rootDir: string;

  constructor(customRootDir?: string) {
    if (customRootDir) {
      this.rootDir = customRootDir;
    } else {
      let curr = path.dirname(fileURLToPath(import.meta.url));
      let found = '';
      for (let i = 0; i < 5; i++) {
        if (fs.existsSync(path.join(curr, 'package.json')) && (fs.existsSync(path.join(curr, '.git')) || fs.existsSync(path.join(curr, 'src')))) {
          found = curr;
          break;
        }
        const parent = path.dirname(curr);
        if (parent === curr) break;
        curr = parent;
      }
      this.rootDir = found || process.cwd();
    }
  }

  public getRootDir(): string {
    return this.rootDir;
  }

  public isGitRepo(): boolean {
    return fs.existsSync(path.join(this.rootDir, '.git'));
  }

  public async getLocalCommit(): Promise<string> {
    if (!this.isGitRepo()) {
      return 'unknown';
    }
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.rootDir });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  public async getRemoteCommit(): Promise<{ sha: string; message: string; author: string; date: string }> {
    const url = 'https://api.github.com/repos/' + this.repoOwner + '/' + this.repoName + '/commits/main';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'OpenKey-Updater-Client',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error('GitHub API returned status ' + res.status + ': ' + res.statusText);
    }

    const data = await res.json() as {
      sha: string;
      commit?: {
        message?: string;
        author?: { name?: string; date?: string };
      };
    };

    return {
      sha: data.sha || '',
      message: data.commit?.message?.split('\n')[0] || '',
      author: data.commit?.author?.name || 'OpenKey Contributor',
      date: data.commit?.author?.date || new Date().toISOString(),
    };
  }

  public async checkForUpdates(): Promise<UpdateCheckResult> {
    const isGit = this.isGitRepo();
    const currentCommit = await this.getLocalCommit();
    const remote = await this.getRemoteCommit();

    const currentShort = currentCommit.slice(0, 7);
    const remoteShort = remote.sha.slice(0, 7);

    const hasUpdate = Boolean(remote.sha && currentCommit !== 'unknown' && currentCommit !== remote.sha);

    return {
      hasUpdate,
      currentCommit: currentShort,
      latestCommit: remoteShort,
      latestMessage: remote.message,
      latestAuthor: remote.author,
      latestDate: remote.date,
      isGitRepo: isGit,
      repoUrl: 'https://github.com/' + this.repoOwner + '/' + this.repoName,
    };
  }

  public async applyUpdate(onProgress?: (step: string) => void): Promise<UpdateApplyResult> {
    const prevCommit = await this.getLocalCommit();
    const logs: string[] = [];

    const log = (msg: string) => {
      logs.push(msg);
      if (onProgress) onProgress(msg);
    };

    if (!this.isGitRepo()) {
      log('Running global npm installation from GitHub repository...');
      try {
        const { stdout, stderr } = await execAsync('npm install -g github:' + this.repoOwner + '/' + this.repoName);
        log(stdout);
        if (stderr) log(stderr);
        return {
          success: true,
          previousCommit: prevCommit.slice(0, 7),
          updatedCommit: 'latest',
          output: logs.join('\n'),
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          previousCommit: prevCommit.slice(0, 7),
          updatedCommit: prevCommit.slice(0, 7),
          output: logs.join('\n'),
          error: errorMsg,
        };
      }
    }

    try {
      log('Fetching latest commits from origin/main...');
      await execAsync('git fetch origin main', { cwd: this.rootDir });

      log('Pulling latest updates...');
      const { stdout: pullOut } = await execAsync('git pull origin main', { cwd: this.rootDir });
      log(pullOut.trim());

      log('Installing dependencies...');
      await execAsync('npm install', { cwd: this.rootDir });

      log('Compiling TypeScript...');
      await execAsync('npm run build', { cwd: this.rootDir });

      log('Updating global binary link...');
      await execAsync('npm link', { cwd: this.rootDir });

      const newCommit = await this.getLocalCommit();
      log('Update finished successfully.');

      return {
        success: true,
        previousCommit: prevCommit.slice(0, 7),
        updatedCommit: newCommit.slice(0, 7),
        output: logs.join('\n'),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log('Error applying update: ' + errorMsg);
      return {
        success: false,
        previousCommit: prevCommit.slice(0, 7),
        updatedCommit: prevCommit.slice(0, 7),
        output: logs.join('\n'),
        error: errorMsg,
      };
    }
  }
}
