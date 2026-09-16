export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  successThreshold?: number;
  onStateChange?: (modelKey: string, from: CircuitState, to: CircuitState) => void;
}

export interface CircuitBreakerStatus {
  modelKey: string;
  providerId: string;
  modelId: string;
  state: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export class CircuitBreakerOpenError extends Error {
  readonly providerId: string;
  readonly modelId: string;
  readonly cooldownRemainingMs: number;

  constructor(providerId: string, modelId: string, cooldownRemainingMs: number) {
    super(
      `Circuit breaker is OPEN for model ${providerId}:${modelId}. Cooldown active for ${Math.ceil(
        cooldownRemainingMs / 1000
      )}s.`
    );
    this.name = 'CircuitBreakerOpenError';
    this.providerId = providerId;
    this.modelId = modelId;
    this.cooldownRemainingMs = cooldownRemainingMs;
  }
}

interface InternalCircuitState {
  state: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class ModelCircuitBreaker {
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly successThreshold: number;
  private readonly onStateChange?: (modelKey: string, from: CircuitState, to: CircuitState) => void;
  private readonly breakers = new Map<string, InternalCircuitState>();

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownMs = options.cooldownMs ?? 30000;
    this.successThreshold = options.successThreshold ?? 2;
    this.onStateChange = options.onStateChange;
  }

  static getModelKey(providerId: string, modelId: string): string {
    return `${providerId.toLowerCase()}:${modelId.toLowerCase()}`;
  }

  private getOrCreate(providerId: string, modelId: string): { key: string; item: InternalCircuitState } {
    const key = ModelCircuitBreaker.getModelKey(providerId, modelId);
    let item = this.breakers.get(key);
    if (!item) {
      item = {
        state: 'CLOSED',
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      };
      this.breakers.set(key, item);
    }
    return { key, item };
  }

  getState(providerId: string, modelId: string, now: number = Date.now()): CircuitState {
    const { key, item } = this.getOrCreate(providerId, modelId);
    if (item.state === 'OPEN' && now >= item.nextAttemptTime) {
      this.transition(key, item, 'HALF_OPEN');
    }
    return item.state;
  }

  private transition(key: string, item: InternalCircuitState, newState: CircuitState): void {
    if (item.state === newState) return;
    const oldState = item.state;
    item.state = newState;

    if (newState === 'HALF_OPEN') {
      item.consecutiveSuccesses = 0;
    } else if (newState === 'CLOSED') {
      item.consecutiveFailures = 0;
      item.consecutiveSuccesses = 0;
      item.lastFailureTime = 0;
      item.nextAttemptTime = 0;
    }

    if (this.onStateChange) {
      this.onStateChange(key, oldState, newState);
    }
  }

  recordSuccess(providerId: string, modelId: string): void {
    const { key, item } = this.getOrCreate(providerId, modelId);
    const now = Date.now();

    if (item.state === 'OPEN' && now >= item.nextAttemptTime) {
      this.transition(key, item, 'HALF_OPEN');
    }

    if (item.state === 'HALF_OPEN') {
      item.consecutiveSuccesses += 1;
      if (item.consecutiveSuccesses >= this.successThreshold) {
        this.transition(key, item, 'CLOSED');
      }
    } else if (item.state === 'CLOSED') {
      item.consecutiveFailures = 0;
    }
  }

  recordFailure(providerId: string, modelId: string, now: number = Date.now()): void {
    const { key, item } = this.getOrCreate(providerId, modelId);

    item.lastFailureTime = now;
    item.consecutiveFailures += 1;
    item.consecutiveSuccesses = 0;

    if (item.state === 'HALF_OPEN') {
      item.nextAttemptTime = now + this.cooldownMs;
      this.transition(key, item, 'OPEN');
    } else if (item.state === 'CLOSED' && item.consecutiveFailures >= this.failureThreshold) {
      item.nextAttemptTime = now + this.cooldownMs;
      this.transition(key, item, 'OPEN');
    }
  }

  async execute<T>(
    providerId: string,
    modelId: string,
    action: () => Promise<T>,
    now: number = Date.now()
  ): Promise<T> {
    const state = this.getState(providerId, modelId, now);
    const { item } = this.getOrCreate(providerId, modelId);

    if (state === 'OPEN') {
      const remaining = Math.max(0, item.nextAttemptTime - now);
      throw new CircuitBreakerOpenError(providerId, modelId, remaining);
    }

    try {
      const result = await action();
      this.recordSuccess(providerId, modelId);
      return result;
    } catch (err) {
      this.recordFailure(providerId, modelId, Date.now());
      throw err;
    }
  }

  getStatus(providerId: string, modelId: string, now: number = Date.now()): CircuitBreakerStatus {
    const { key, item } = this.getOrCreate(providerId, modelId);
    const state = this.getState(providerId, modelId, now);
    return {
      modelKey: key,
      providerId,
      modelId,
      state,
      consecutiveFailures: item.consecutiveFailures,
      consecutiveSuccesses: item.consecutiveSuccesses,
      lastFailureTime: item.lastFailureTime > 0 ? item.lastFailureTime : undefined,
      nextAttemptTime: item.nextAttemptTime > 0 ? item.nextAttemptTime : undefined,
    };
  }

  getAllStatuses(now: number = Date.now()): Record<string, CircuitBreakerStatus> {
    const result: Record<string, CircuitBreakerStatus> = {};
    for (const [key, item] of this.breakers.entries()) {
      const [providerId, ...rest] = key.split(':');
      const modelId = rest.join(':');
      const state = this.getState(providerId, modelId, now);
      result[key] = {
        modelKey: key,
        providerId,
        modelId,
        state,
        consecutiveFailures: item.consecutiveFailures,
        consecutiveSuccesses: item.consecutiveSuccesses,
        lastFailureTime: item.lastFailureTime > 0 ? item.lastFailureTime : undefined,
        nextAttemptTime: item.nextAttemptTime > 0 ? item.nextAttemptTime : undefined,
      };
    }
    return result;
  }

  reset(providerId?: string, modelId?: string): void {
    if (providerId && modelId) {
      const key = ModelCircuitBreaker.getModelKey(providerId, modelId);
      this.breakers.delete(key);
    } else {
      this.breakers.clear();
    }
  }
}
