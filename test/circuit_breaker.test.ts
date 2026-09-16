import { describe, it, expect, vi } from 'vitest';
import { ModelCircuitBreaker, CircuitBreakerOpenError } from '../src/gateway/circuit_breaker.js';

describe('Model-Granular Circuit Breaker', () => {
  it('should start in CLOSED state for any model', () => {
    const cb = new ModelCircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    expect(cb.getState('openai', 'gpt-4o')).toBe('CLOSED');
  });

  it('should remain CLOSED after successful executions', async () => {
    const cb = new ModelCircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    const result = await cb.execute('openai', 'gpt-4o', async () => 'hello');
    expect(result).toBe('hello');
    expect(cb.getState('openai', 'gpt-4o')).toBe('CLOSED');
  });

  it('should trip to OPEN after reaching failureThreshold', async () => {
    const cb = new ModelCircuitBreaker({ failureThreshold: 2, cooldownMs: 5000 });

    const failingAction = async () => {
      throw new Error('API timeout');
    };

    await expect(cb.execute('openai', 'gpt-4o', failingAction)).rejects.toThrow('API timeout');
    expect(cb.getState('openai', 'gpt-4o')).toBe('CLOSED');

    await expect(cb.execute('openai', 'gpt-4o', failingAction)).rejects.toThrow('API timeout');
    expect(cb.getState('openai', 'gpt-4o')).toBe('OPEN');

    // Subsequent calls should fail fast with CircuitBreakerOpenError
    await expect(cb.execute('openai', 'gpt-4o', failingAction)).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('should isolate failures strictly per modelKey', async () => {
    const cb = new ModelCircuitBreaker({ failureThreshold: 2, cooldownMs: 5000 });

    // Fail gpt-4o 2 times
    cb.recordFailure('openai', 'gpt-4o');
    cb.recordFailure('openai', 'gpt-4o');
    expect(cb.getState('openai', 'gpt-4o')).toBe('OPEN');

    // Another model under same provider must remain CLOSED
    expect(cb.getState('openai', 'text-embedding-3-small')).toBe('CLOSED');
    // Another provider must remain CLOSED
    expect(cb.getState('deepseek', 'deepseek-chat')).toBe('CLOSED');
  });

  it('should transition to HALF_OPEN after cooldown and recover to CLOSED after canary successes', () => {
    const stateTransitions: string[] = [];
    const cb = new ModelCircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 1000,
      successThreshold: 2,
      onStateChange: (key, from, to) => stateTransitions.push(`${from}->${to}`),
    });

    const now = 10000;
    cb.recordFailure('anthropic', 'claude-3-5-sonnet', now);
    cb.recordFailure('anthropic', 'claude-3-5-sonnet', now);
    expect(cb.getState('anthropic', 'claude-3-5-sonnet', now)).toBe('OPEN');

    // Before cooldown expires: still OPEN
    expect(cb.getState('anthropic', 'claude-3-5-sonnet', now + 500)).toBe('OPEN');

    // After cooldown expires: transitions to HALF_OPEN
    expect(cb.getState('anthropic', 'claude-3-5-sonnet', now + 1001)).toBe('HALF_OPEN');

    // First canary success
    cb.recordSuccess('anthropic', 'claude-3-5-sonnet');
    expect(cb.getState('anthropic', 'claude-3-5-sonnet', now + 1002)).toBe('HALF_OPEN');

    // Second canary success: back to CLOSED
    cb.recordSuccess('anthropic', 'claude-3-5-sonnet');
    expect(cb.getState('anthropic', 'claude-3-5-sonnet', now + 1003)).toBe('CLOSED');

    expect(stateTransitions).toContain('CLOSED->OPEN');
    expect(stateTransitions).toContain('OPEN->HALF_OPEN');
    expect(stateTransitions).toContain('HALF_OPEN->CLOSED');
  });

  it('should re-trip to OPEN if canary trial fails in HALF_OPEN', () => {
    const cb = new ModelCircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 1000,
      successThreshold: 2,
    });

    const now = 20000;
    cb.recordFailure('gemini', 'gemini-1.5-pro', now);
    cb.recordFailure('gemini', 'gemini-1.5-pro', now);
    expect(cb.getState('gemini', 'gemini-1.5-pro', now)).toBe('OPEN');

    // Advance past cooldown into HALF_OPEN
    expect(cb.getState('gemini', 'gemini-1.5-pro', now + 1050)).toBe('HALF_OPEN');

    // Canary request fails
    cb.recordFailure('gemini', 'gemini-1.5-pro', now + 1060);
    expect(cb.getState('gemini', 'gemini-1.5-pro', now + 1060)).toBe('OPEN');
  });

  it('should allow manual reset', () => {
    const cb = new ModelCircuitBreaker({ failureThreshold: 1, cooldownMs: 5000 });
    cb.recordFailure('mistral', 'mistral-large');
    expect(cb.getState('mistral', 'mistral-large')).toBe('OPEN');

    cb.reset('mistral', 'mistral-large');
    expect(cb.getState('mistral', 'mistral-large')).toBe('CLOSED');
  });
});
