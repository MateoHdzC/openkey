import type { ChatMessage } from '../providers/adapter.interface.js';

export interface CompressionOptions {
  maxTokens: number;
  preserveRecentCount?: number;
  compactIntermediateToolResults?: boolean;
}

export interface CompressionStats {
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  reductionRatio: number;
  messagesCompacted: number;
}

export interface CompressionResult {
  messages: ChatMessage[];
  isCompressed: boolean;
  stats: CompressionStats;
}

export class AdaptiveContextCompressor {
  /**
   * Fast heuristic token estimation (~4 characters per token + framing overhead)
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    const clean = text.trim();
    if (clean.length === 0) return 0;
    // Fast estimation: roughly 3.8 chars per token for code & prose
    return Math.ceil(clean.length / 3.8);
  }

  static estimateMessageTokens(msg: ChatMessage): number {
    let count = 4; // message metadata overhead (role, framing)
    if (typeof msg.content === 'string') {
      count += AdaptiveContextCompressor.estimateTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text' && part.text) {
          count += AdaptiveContextCompressor.estimateTokens(part.text);
        } else if (part.type === 'image') {
          count += 85; // baseline low-detail image estimate
        }
      }
    }

    if (msg.toolCalls && msg.toolCalls.length > 0) {
      count += AdaptiveContextCompressor.estimateTokens(JSON.stringify(msg.toolCalls));
    }
    return count;
  }

  static estimateTotalTokens(messages: ChatMessage[]): number {
    return messages.reduce((acc, m) => acc + AdaptiveContextCompressor.estimateMessageTokens(m), 0);
  }

  /**
   * Compresses message history if estimated tokens exceed the maxTokens budget.
   * System messages and the most recent N turns are strictly preserved.
   */
  static compress(messages: ChatMessage[], options: CompressionOptions): CompressionResult {
    const originalTokens = AdaptiveContextCompressor.estimateTotalTokens(messages);
    const preserveRecent = Math.max(1, options.preserveRecentCount ?? 4);

    if (originalTokens <= options.maxTokens || messages.length <= preserveRecent + 1) {
      return {
        messages: [...messages],
        isCompressed: false,
        stats: {
          originalTokens,
          compressedTokens: originalTokens,
          tokensSaved: 0,
          reductionRatio: 0,
          messagesCompacted: 0,
        },
      };
    }

    // Split messages into:
    // 1. Initial system messages (never discarded)
    // 2. Middle messages (eligible for compression/summarization)
    // 3. Recent messages (preserved)
    const systemMessages: ChatMessage[] = [];
    const restMessages: ChatMessage[] = [];

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'system' && restMessages.length === 0) {
        systemMessages.push(messages[i]);
      } else {
        restMessages.push(messages[i]);
      }
    }

    if (restMessages.length <= preserveRecent) {
      return {
        messages: [...messages],
        isCompressed: false,
        stats: {
          originalTokens,
          compressedTokens: originalTokens,
          tokensSaved: 0,
          reductionRatio: 0,
          messagesCompacted: 0,
        },
      };
    }

    const middleMessages = restMessages.slice(0, restMessages.length - preserveRecent);
    const recentMessages = restMessages.slice(restMessages.length - preserveRecent);

    // Phase 1: If compactIntermediateToolResults is enabled, truncate verbose tool outputs
    const compactedMiddle: ChatMessage[] = middleMessages.map((m) => {
      if (m.role === 'tool' && typeof m.content === 'string' && m.content.length > 400) {
        const snippet = m.content.substring(0, 200).trim();
        return {
          ...m,
          content: `${snippet}\n... [OpenKey: Tool output truncated for context optimization (${m.content.length} chars)]`,
        };
      }
      return m;
    });

    let candidateMessages = [...systemMessages, ...compactedMiddle, ...recentMessages];
    let currentTokens = AdaptiveContextCompressor.estimateTotalTokens(candidateMessages);

    // Phase 2: If still above maxTokens, synthesize intermediate messages into an executive context summary
    let messagesCompactedCount = 0;
    if (currentTokens > options.maxTokens) {
      messagesCompactedCount = compactedMiddle.length;
      const summarySnippets: string[] = [];

      for (const m of compactedMiddle) {
        const text = typeof m.content === 'string' ? m.content : '[complex content]';
        const truncated = text.length > 120 ? text.substring(0, 117) + '...' : text;
        summarySnippets.push(`- ${m.role.toUpperCase()}: ${truncated}`);
      }

      const summaryContent = [
        `[OpenKey Context Compressor: ${messagesCompactedCount} earlier turns summarized to respect context window limit]`,
        ...summarySnippets.slice(0, 10),
        summarySnippets.length > 10 ? `... (${summarySnippets.length - 10} additional turns omitted)` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const summaryMessage: ChatMessage = {
        role: 'system',
        content: summaryContent,
      };

      candidateMessages = [...systemMessages, summaryMessage, ...recentMessages];
      currentTokens = AdaptiveContextCompressor.estimateTotalTokens(candidateMessages);
    }

    const tokensSaved = Math.max(0, originalTokens - currentTokens);
    const reductionRatio = originalTokens > 0 ? Number((tokensSaved / originalTokens).toFixed(4)) : 0;

    return {
      messages: candidateMessages,
      isCompressed: true,
      stats: {
        originalTokens,
        compressedTokens: currentTokens,
        tokensSaved,
        reductionRatio,
        messagesCompacted: messagesCompactedCount,
      },
    };
  }
}
