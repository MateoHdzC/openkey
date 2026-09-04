/**
 * Universal Provider, Model, and Tool interfaces for OpenKey.
 * Normalizes all differences between OpenAI, Anthropic, Gemini, DeepSeek,
 * OpenRouter, Groq, Ollama, and generic OpenAI-compatible APIs.
 */

export interface ModelCapabilities {
  text: boolean;
  streaming: boolean;
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  usageMetrics: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  capabilities: ModelCapabilities;
  isCustom?: boolean;
}

export interface MessageContentPart {
  type: 'text' | 'image';
  text?: string;
  imageUrl?: { url: string; detail?: 'low' | 'high' | 'auto' };
  imageData?: { mimeType: string; dataBase64: string };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | MessageContentPart[];
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costEstimateUSD?: number;
}

export interface StreamChunk {
  type: 'text' | 'reasoning' | 'tool_call_delta' | 'tool_call' | 'usage' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
  toolCallDelta?: Partial<ToolCall>;
  usage?: TokenUsage;
  error?: string;
}

export interface ChatRequest {
  modelId: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: TokenUsage;
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface ProviderCredentials {
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  authType?: 'bearer' | 'api-key' | 'custom';
  organizationId?: string;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  defaultBaseUrl: string;
  websiteUrl: string;
  docsUrl: string;
  requiresApiKey: boolean;
  supportsCustomBaseUrl: boolean;
  supportsModelDiscovery: boolean;
  defaultModels: ModelInfo[];
}

export interface ProviderAdapter {
  readonly meta: ProviderMetadata;

  validateCredentials(credentials: ProviderCredentials): Promise<{ valid: boolean; error?: string }>;
  listModels(credentials: ProviderCredentials): Promise<ModelInfo[]>;
  chat(request: ChatRequest, credentials: ProviderCredentials): Promise<ChatResponse>;
  chatStream(request: ChatRequest, credentials: ProviderCredentials): AsyncIterable<StreamChunk>;
}
