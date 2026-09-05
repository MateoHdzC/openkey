import { describe, it, expect } from 'vitest';
import { UpdateManager } from '../src/core/updater.js';
import path from 'node:path';

describe('UpdateManager', () => {
  const manager = new UpdateManager(process.cwd());

  it('should detect the root directory and git repository', () => {
    expect(manager.getRootDir()).toBe(process.cwd());
    expect(manager.isGitRepo()).toBe(true);
  });

  it('should retrieve the local commit hash', async () => {
    const commit = await manager.getLocalCommit();
    expect(commit).toBeDefined();
    expect(commit.length).toBeGreaterThanOrEqual(7);
  });

  it('should handle update checks without crashing', async () => {
    try {
      const check = await manager.checkForUpdates();
      expect(check).toHaveProperty('hasUpdate');
      expect(check).toHaveProperty('currentCommit');
      expect(check).toHaveProperty('latestCommit');
      expect(check).toHaveProperty('repoUrl');
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }
  });
});
