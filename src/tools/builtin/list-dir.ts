import fs from 'node:fs';
import path from 'node:path';
import type { Tool, ToolExecutionContext } from '../tool.interface.js';
import { WorkspaceSandbox } from '../../security/sandbox.js';

export class ListDirTool implements Tool {
  public readonly category = 'files' as const;
  public readonly definition = {
    name: 'list_directory',
    description: 'Lists files and folders inside a given directory in the workspace.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the directory to list (leave empty or "." for workspace root).',
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to list recursively (default: false, max depth: 3).',
        },
      },
    },
  };

  public isDangerous(): boolean {
    return false;
  }

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string> {
    const dirPath = String(args.path || '.');
    const recursive = Boolean(args.recursive);
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(dirPath, context.allowOutsideWorkspace);

    if (!fs.existsSync(safePath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const results: string[] = [];

    const scan = (currentPath: string, depth: number) => {
      if (depth > 3) return;
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        const rel = path.relative(context.workspaceRoot, path.join(currentPath, entry.name));
        results.push(entry.isDirectory() ? `${rel}/` : rel);
        if (recursive && entry.isDirectory()) {
          scan(path.join(currentPath, entry.name), depth + 1);
        }
      }
    };

    scan(safePath, 1);
    return results.length > 0 ? results.join('\n') : '(empty directory)';
  }
}

export class SearchFilesTool implements Tool {
  public readonly category = 'files' as const;
  public readonly definition = {
    name: 'search_files',
    description: 'Searches for text or regex patterns across files in the workspace.',
    parameters: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The string or pattern to search for.',
        },
        extension: {
          type: 'string',
          description: 'Optional file extension filter (e.g. ".ts", ".json").',
        },
      },
      required: ['query'],
    },
  };

  public isDangerous(): boolean {
    return false;
  }

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<string> {
    const query = String(args.query);
    const extFilter = args.extension ? String(args.extension) : undefined;
    const matches: string[] = [];

    const scan = (currentPath: string, depth: number) => {
      if (depth > 5) return;
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.openkey') {
          continue;
        }
        const full = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          scan(full, depth + 1);
        } else if (entry.isFile()) {
          if (extFilter && !entry.name.endsWith(extFilter)) continue;
          try {
            const stats = fs.statSync(full);
            if (stats.size > 1024 * 1024) continue;
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(query)) {
                const rel = path.relative(context.workspaceRoot, full);
                matches.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
                if (matches.length >= 30) return;
              }
            }
          } catch {
          }
        }
      }
    };

    scan(context.workspaceRoot, 1);
    return matches.length > 0 ? matches.join('\n') : `No matches found for "${query}"`;
  }
}
