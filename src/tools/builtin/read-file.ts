import fs from 'node:fs';
import path from 'node:path';
import type { Tool, ToolExecutionContext } from '../tool.interface.js';
import { WorkspaceSandbox } from '../../security/sandbox.js';

export class ReadFileTool implements Tool {
  public readonly category = 'files' as const;
  public readonly definition = {
    name: 'read_file',
    description: 'Reads the text content of a file within the current project workspace.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative or absolute path to the file to read.',
        },
      },
      required: ['path'],
    },
  };

  public isDangerous(): boolean {
    return false;
  }

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string> {
    const filePath = String(args.path);
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(filePath, context.allowOutsideWorkspace);

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(safePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a regular file: ${filePath}`);
    }

    if (stats.size > 2 * 1024 * 1024) {
      throw new Error(`File too large to read in full (>2MB): ${filePath}`);
    }

    const content = fs.readFileSync(safePath, 'utf8');
    return content;
  }
}
