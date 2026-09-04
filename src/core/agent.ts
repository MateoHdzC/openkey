import type {
  ChatMessage,
  ChatRequest,
  StreamChunk,
  TokenUsage,
} from '../providers/adapter.interface.js';
import { ProviderRegistry } from '../providers/registry.js';
import { ToolRuntime } from '../tools/runtime.js';
import { StorageDatabase } from '../storage/db.js';
import { ConfigManager } from './config.js';
import { sanitizeText, sanitizeData } from './sanitizer.js';
import path from 'node:path';
import fs from 'node:fs';

export interface AgentEvent {
  type: 'token' | 'reasoning' | 'tool_start' | 'tool_end' | 'usage' | 'error' | 'done';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  usage?: TokenUsage;
  error?: string;
}

export interface AgentOptions {
  workspaceRoot?: string;
  sessionId?: string;
  onConfirmRequest?: (prompt: string) => Promise<boolean>;
}

export class OpenKeyAgent {
  private registry: ProviderRegistry;
  private tools: ToolRuntime;
  private db: StorageDatabase;
  private configManager: ConfigManager;
  private workspaceRoot: string;

  constructor(options?: {
    registry?: ProviderRegistry;
    tools?: ToolRuntime;
    db?: StorageDatabase;
    configManager?: ConfigManager;
    workspaceRoot?: string;
  }) {
    this.db = options?.db || new StorageDatabase();
    this.configManager = options?.configManager || new ConfigManager(this.db);
    this.registry = options?.registry || new ProviderRegistry(this.configManager, this.db);
    this.tools = options?.tools || new ToolRuntime();
    this.workspaceRoot = path.resolve(options?.workspaceRoot || process.cwd());
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  private buildSystemPrompt(): string {
    return `Current Workspace Root: ${this.workspaceRoot}`;
  }

  
  public async *run(
    prompt: string,
    history: ChatMessage[] = [],
    options?: AgentOptions
  ): AsyncIterable<AgentEvent> {
    const startTime = Date.now();
    const config = this.configManager.getConfig();
    const providerId = config.activeProviderId;
    const modelId = config.activeModelId;

    const adapter = this.registry.getAdapter(providerId);
    let credentials;
    try {
      credentials = await this.registry.getCredentials(providerId, config.activeKeyId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      yield { type: 'error', error: sanitizeText(msg) };
      return;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: this.buildSystemPrompt() },
      ...history,
      { role: 'user', content: prompt },
    ];

    const modelInfo = (await adapter.listModels(credentials)).find((m) => m.id === modelId);
    const supportsTools = modelInfo ? modelInfo.capabilities.tools : true;
    const availableTools = supportsTools ? this.tools.getDefinitions() : undefined;

    let totalInput = 0;
    let totalOutput = 0;
    let turnCount = 0;
    const MAX_TURNS = 10;

    try {
      while (turnCount < MAX_TURNS) {
        turnCount++;
        let assistantText = '';
        let assistantReasoning = '';
        const pendingToolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];

        const request: ChatRequest = {
          modelId,
          messages,
          tools: availableTools,
        };

        for await (const chunk of adapter.chatStream(request, credentials)) {
          if (chunk.type === 'text' && chunk.content) {
            assistantText += chunk.content;
            yield { type: 'token', content: chunk.content };
          } else if (chunk.type === 'reasoning' && chunk.content) {
            assistantReasoning += chunk.content;
            yield { type: 'reasoning', content: chunk.content };
          } else if (chunk.type === 'tool_call' && chunk.toolCall) {
            pendingToolCalls.push(chunk.toolCall);
          } else if (chunk.type === 'usage' && chunk.usage) {
            totalInput += chunk.usage.inputTokens;
            totalOutput += chunk.usage.outputTokens;
            yield { type: 'usage', usage: chunk.usage };
          } else if (chunk.type === 'error' && chunk.error) {
            yield { type: 'error', error: sanitizeText(chunk.error) };
            return;
          }
        }

        messages.push({
          role: 'assistant',
          content: assistantText,
          ...(pendingToolCalls.length > 0 ? { toolCalls: pendingToolCalls } : {}),
        });

        if (pendingToolCalls.length === 0) {
          break;
        }

        for (const tc of pendingToolCalls) {
          yield {
            type: 'tool_start',
            toolName: tc.name,
            toolArgs: tc.arguments,
          };

          let toolOutput = '';
          try {
            toolOutput = await this.tools.executeTool(tc.name, tc.arguments, {
              workspaceRoot: options?.workspaceRoot || this.workspaceRoot,
              onConfirmRequest: options?.onConfirmRequest,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toolOutput = `Error executing tool ${tc.name}: ${sanitizeText(msg)}`;
          }

          yield {
            type: 'tool_end',
            toolName: tc.name,
            toolResult: toolOutput,
          };

          messages.push({
            role: 'tool',
            name: tc.name,
            toolCallId: tc.id,
            content: toolOutput,
          });
        }
      }

      const durationMs = Date.now() - startTime;
      this.db.logUsage({
        timestamp: new Date().toISOString(),
        providerId,
        modelId,
        durationMs,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        totalTokens: totalInput + totalOutput,
        status: 'success',
      });

      yield { type: 'done' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.db.logUsage({
        timestamp: new Date().toISOString(),
        providerId,
        modelId,
        durationMs: Date.now() - startTime,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        totalTokens: totalInput + totalOutput,
        status: 'error',
        errorType: sanitizeText(msg),
      });

      yield { type: 'error', error: sanitizeText(msg) };
    }
  }
}
