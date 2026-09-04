import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool, ToolExecutionContext } from '../tool.interface.js';
import { PermissionFirewall } from '../../security/permissions.js';
import { sanitizeText } from '../../core/sanitizer.js';

const execAsync = promisify(exec);

export class ExecuteCommandTool implements Tool {
  public readonly category = 'terminal' as const;
  private firewall = new PermissionFirewall();

  public readonly definition = {
    name: 'execute_command',
    description: 'Executes a command in the terminal inside the workspace directory.',
    parameters: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute (e.g. "npm test", "git status").',
        },
      },
      required: ['command'],
    },
  };

  public isDangerous(args: Record<string, unknown>): boolean {
    const cmd = String(args.command || '');
    return this.firewall.evaluateCommandRisk(cmd) !== 'safe';
  }

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string> {
    const cmd = String(args.command || '').trim();
    if (!cmd) {
      throw new Error('Command cannot be empty');
    }

    const risk = this.firewall.evaluateCommandRisk(cmd);
    if (risk === 'dangerous') {
      if (context.onConfirmRequest) {
        const allowed = await context.onConfirmRequest(`DANGEROUS ACTION: The agent wants to execute "${cmd}". Allow?`);
        if (!allowed) {
          throw new Error(`Execution of dangerous command "${cmd}" was denied by user.`);
        }
      } else {
        throw new Error(`Execution of dangerous command "${cmd}" is blocked by security policy.`);
      }
    } else if (risk === 'unknown' && context.onConfirmRequest) {
      const allowed = await context.onConfirmRequest(`The agent wants to execute "${cmd}". Allow?`);
      if (!allowed) {
        throw new Error(`Execution of command "${cmd}" was cancelled.`);
      }
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: context.workspaceRoot,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });

      const output = (stdout + (stderr ? `\nSTDERR:\n${stderr}` : '')).trim();
      return sanitizeText(output || '(command completed with no output)');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Command failed: ${sanitizeText(errorMsg)}`);
    }
  }
}
