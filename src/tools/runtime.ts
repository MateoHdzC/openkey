import type { Tool, ToolExecutionContext } from './tool.interface.js';
import type { ToolDefinition } from '../providers/adapter.interface.js';
import { ReadFileTool } from './builtin/read-file.js';
import { WriteFileTool, EditFileTool } from './builtin/write-file.js';
import { ListDirTool, SearchFilesTool } from './builtin/list-dir.js';
import { ExecuteCommandTool } from './builtin/execute-cmd.js';

export class ToolRuntime {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerTool(new ReadFileTool());
    this.registerTool(new WriteFileTool());
    this.registerTool(new EditFileTool());
    this.registerTool(new ListDirTool());
    this.registerTool(new SearchFilesTool());
    this.registerTool(new ExecuteCommandTool());
  }

  public registerTool(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  public async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not available in OpenKey.`);
    }

    return await tool.execute(args, context);
  }
}
