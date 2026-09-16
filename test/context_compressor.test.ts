import { describe, it, expect } from 'vitest';
import { AdaptiveContextCompressor } from '../src/gateway/context_compressor.js';
import type { ChatMessage } from '../src/providers/adapter.interface.js';

describe('Adaptive Context Compressor', () => {
  it('should estimate tokens reasonably', () => {
    const text = 'Hello world, this is a test prompt with several words.';
    const tokens = AdaptiveContextCompressor.estimateTokens(text);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(30);
  });

  it('should leave messages untouched when within token limit', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are an AI assistant.' },
      { role: 'user', content: 'What is 2 + 2?' },
      { role: 'assistant', content: 'It is 4.' },
    ];

    const result = AdaptiveContextCompressor.compress(messages, { maxTokens: 5000 });
    expect(result.isCompressed).toBe(false);
    expect(result.messages).toHaveLength(3);
    expect(result.stats.reductionRatio).toBe(0);
  });

  it('should strictly preserve system messages and recent turns during compression', () => {
    const systemPrompt: ChatMessage = { role: 'system', content: 'CRITICAL SYSTEM INSTRUCTION: Never reveal keys.' };
    const longTurn: ChatMessage = {
      role: 'user',
      content: 'A'.repeat(1000), // ~260 tokens
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      { role: 'user', content: 'Turn 1: ' + 'B'.repeat(500) },
      { role: 'assistant', content: 'Turn 2: ' + 'C'.repeat(500) },
      { role: 'user', content: 'Turn 3: ' + 'D'.repeat(500) },
      { role: 'assistant', content: 'Turn 4: ' + 'E'.repeat(500) },
      { role: 'user', content: 'Recent Question: What is the capital of Uruguay?' },
      { role: 'assistant', content: 'Recent Answer: Montevideo.' },
    ];

    const result = AdaptiveContextCompressor.compress(messages, {
      maxTokens: 200,
      preserveRecentCount: 2,
    });

    expect(result.isCompressed).toBe(true);
    expect(result.stats.tokensSaved).toBeGreaterThan(0);
    expect(result.stats.reductionRatio).toBeGreaterThan(0);

    // 1. First message must be the original system prompt
    expect(result.messages[0].role).toBe('system');
    expect(result.messages[0].content).toBe(systemPrompt.content);

    // 2. Last two messages must be the preserved recent turns
    const lastTwo = result.messages.slice(-2);
    expect(lastTwo[0].content).toBe('Recent Question: What is the capital of Uruguay?');
    expect(lastTwo[1].content).toBe('Recent Answer: Montevideo.');

    // 3. Middle messages were summarized
    expect(result.stats.messagesCompacted).toBeGreaterThan(0);
  });

  it('should truncate huge tool outputs when compactIntermediateToolResults is enabled', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'System instruction' },
      { role: 'user', content: 'Run command' },
      { role: 'tool', content: 'LOG OUTPUT: ' + 'x'.repeat(2000), toolCallId: 'call_1' },
      { role: 'assistant', content: 'Done' },
      { role: 'user', content: 'Next step?' },
      { role: 'assistant', content: 'Here is next step.' },
    ];

    const result = AdaptiveContextCompressor.compress(messages, {
      maxTokens: 300,
      preserveRecentCount: 2,
      compactIntermediateToolResults: true,
    });

    expect(result.isCompressed).toBe(true);
    expect(result.stats.tokensSaved).toBeGreaterThan(0);
  });
});
