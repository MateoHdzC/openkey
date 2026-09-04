import type { ToolDefinition } from '../providers/adapter.interface.js';

export interface ToolExecutionContext {
  workspaceRoot: string;
  allowOutsideWorkspace?: boolean;
  onConfirmRequest?: (prompt: string) => Promise<boolean>;
}

export interface Tool {
  readonly definition: ToolDefinition;
  readonly category: 'files' | 'terminal' | 'network' | 'utility';

  isDangerous(args: Record<string, unknown>): boolean;
  execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string>;
}
