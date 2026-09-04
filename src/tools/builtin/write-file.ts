import fs from 'node:fs';
import path from 'node:path';
import type { Tool, ToolExecutionContext } from '../tool.interface.js';
import { WorkspaceSandbox } from '../../security/sandbox.js';

export class WriteFileTool implements Tool {
  public readonly category = 'files' as const;
  public readonly definition = {
    name: 'write_file',
    description: 'Creates a new file or completely overwrites an existing file with the provided content.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file to create or overwrite.',
        },
        content: {
          type: 'string',
          description: 'Full text content to write to the file.',
        },
      },
      required: ['path', 'content'],
    },
  };

  public isDangerous(): boolean {
    return true;
  }

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string> {
    const filePath = String(args.path);
    const content = String(args.content);
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(filePath, context.allowOutsideWorkspace);

    const dir = path.dirname(safePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(safePath, content, 'utf8');
    return `Successfully wrote ${Buffer.byteLength(content, 'utf8')} bytes to ${filePath}`;
  }
}

export class EditFileTool implements Tool {
  public readonly category = 'files' as const;
  public readonly definition = {
    name: 'edit_file',
    description: 'Replaces a specific target string with replacement text in an existing file.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file to edit.',
        },
        target: {
          type: 'string',
          description: 'Exact substring to replace.',
        },
        replacement: {
          type: 'string',
          description: 'New content to insert in place of the target.',
        },
      },
      required: ['path', 'target', 'replacement'],
    },
  };

  public isDangerous(): boolean {
    return false;
  }

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string> {
    const filePath = String(args.path);
    const target = String(args.target);
    const replacement = String(args.replacement);

    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(filePath, context.allowOutsideWorkspace);

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(safePath, 'utf8');
    if (!content.includes(target)) {
      throw new Error(`Target text to replace was not found in ${filePath}`);
    }

    const occurrences = content.split(target).length - 1;
    if (occurrences > 1) {
      throw new Error(
        `Target text occurs ${occurrences} times in ${filePath}. Please provide a more specific, unique block of code.`
      );
    }

    const updated = content.replace(target, replacement);
    fs.writeFileSync(safePath, updated, 'utf8');
    return `Successfully edited ${filePath} (1 occurrence replaced)`;
  }
}
