/**
 * Security permissions engine.
 * Governs tool execution, dangerous command inspection, and interactive confirmation gates.
 */

export type PermissionAction = 'allow' | 'ask' | 'deny';

export interface PermissionPolicy {
  files: {
    read: PermissionAction;
    write: PermissionAction;
    delete: PermissionAction;
  };
  terminal: {
    safe: PermissionAction;
    unknown: PermissionAction;
    dangerous: PermissionAction;
  };
  network: PermissionAction;
}

export const DEFAULT_PERMISSION_POLICY: PermissionPolicy = {
  files: {
    read: 'allow',
    write: 'ask',
    delete: 'ask',
  },
  terminal: {
    safe: 'allow',
    unknown: 'ask',
    dangerous: 'deny',
  },
  network: 'ask',
};

const DANGEROUS_COMMAND_PATTERNS: RegExp[] = [
  /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f*|-[a-zA-Z]*f[a-zA-Z]*r*)\s+[\/\\]/i,
  /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f*|-[a-zA-Z]*f[a-zA-Z]*r*)\s+~/i,
  /\b(mkfs|fdisk|parted|dd)\b/i,
  />\s*\/dev\/(sda|sdb|nvme|null|zero)/i,
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
  /\bchmod\s+(-R\s+)?777\s+[\/\\]/i,
  /\b(curl|wget)\b.*\|\s*(sh|bash|zsh|pwsh|powershell)/i,
  /\b(shutdown|reboot|poweroff|init\s+0)\b/i,
];

const SAFE_COMMAND_PREFIXES: string[] = [
  'git status',
  'git log',
  'git diff',
  'git branch',
  'npm test',
  'npm run test',
  'npm run lint',
  'node -v',
  'npm -v',
  'pwd',
  'dir',
  'ls',
  'echo',
  'cat',
  'head',
  'tail',
  'grep',
  'rg',
  'find',
  'which',
  'where',
];

export class PermissionFirewall {
  private policy: PermissionPolicy;
  private alwaysAllowedCommands: Set<string> = new Set();

  constructor(policy: PermissionPolicy = DEFAULT_PERMISSION_POLICY) {
    this.policy = policy;
  }

  public getPolicy(): PermissionPolicy {
    return { ...this.policy };
  }

  public updatePolicy(newPolicy: Partial<PermissionPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  public allowCommandAlways(command: string): void {
    this.alwaysAllowedCommands.add(command.trim());
  }

  /**
   * Evaluates the risk level of a terminal command.
   */
  public evaluateCommandRisk(command: string): 'safe' | 'dangerous' | 'unknown' {
    const trimmed = command.trim();

    if (this.alwaysAllowedCommands.has(trimmed)) {
      return 'safe';
    }

    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(trimmed)) {
        return 'dangerous';
      }
    }

    const lower = trimmed.toLowerCase();
    for (const safePrefix of SAFE_COMMAND_PREFIXES) {
      if (lower === safePrefix || lower.startsWith(safePrefix + ' ')) {
        return 'safe';
      }
    }

    return 'unknown';
  }

  /**
   * Checks if an action should be allowed, asked, or denied according to policy.
   */
  public checkFilePermission(action: 'read' | 'write' | 'delete'): PermissionAction {
    return this.policy.files[action] || 'ask';
  }

  public checkTerminalPermission(command: string): PermissionAction {
    const risk = this.evaluateCommandRisk(command);
    return this.policy.terminal[risk] || 'ask';
  }

  public checkNetworkPermission(): PermissionAction {
    return this.policy.network;
  }
}
