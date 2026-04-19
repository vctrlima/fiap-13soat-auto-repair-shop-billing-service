type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  /** Name for logging identification */
  name?: string;
  /** Failure percentage to trip the circuit (default: 50) */
  errorThresholdPercentage?: number;
  /** Time in ms before attempting half-open probe (default: 30000) */
  resetTimeout?: number;
  /** Minimum requests in the window before evaluating threshold (default: 5) */
  volumeThreshold?: number;
  /** Rolling window duration in ms for failure counting (default: 60000) */
  rollingWindowDuration?: number;
}

export class DatabaseCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private windowStart = Date.now();

  private readonly errorThreshold: number;
  private readonly resetTimeout: number;
  private readonly volumeThreshold: number;
  private readonly windowDuration: number;
  private readonly label: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.label = options.name ?? "database";
    this.errorThreshold = options.errorThresholdPercentage ?? 50;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.volumeThreshold = options.volumeThreshold ?? 5;
    this.windowDuration = options.rollingWindowDuration ?? 60000;
  }

  private resetWindowIfExpired(): void {
    if (Date.now() - this.windowStart >= this.windowDuration) {
      this.failures = 0;
      this.successes = 0;
      this.windowStart = Date.now();
    }
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = "HALF_OPEN";
        console.info(
          `[CircuitBreaker:${this.label}] State: HALF_OPEN — probing connectivity`,
        );
      } else {
        throw new Error(
          `Circuit breaker [${this.label}] is OPEN — requests are temporarily blocked`,
        );
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.resetWindowIfExpired();
    this.successes++;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failures = 0;
      this.successes = 0;
      this.windowStart = Date.now();
      console.info(
        `[CircuitBreaker:${this.label}] State: CLOSED — connectivity restored`,
      );
    }
  }

  private onFailure(): void {
    this.resetWindowIfExpired();
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      console.warn(
        `[CircuitBreaker:${this.label}] State: OPEN — half-open probe failed`,
      );
      return;
    }

    const total = this.failures + this.successes;
    if (total >= this.volumeThreshold) {
      const failureRate = (this.failures / total) * 100;
      if (failureRate >= this.errorThreshold) {
        this.state = "OPEN";
        this.failures = 0;
        this.successes = 0;
        this.windowStart = Date.now();
        console.warn(
          `[CircuitBreaker:${this.label}] State: OPEN — failure rate ${failureRate.toFixed(1)}% exceeded threshold ${this.errorThreshold}%`,
        );
      }
    }
  }

  get currentState(): CircuitState {
    return this.state;
  }

  get isOpen(): boolean {
    return this.state === "OPEN";
  }
}

export const databaseCircuitBreaker = new DatabaseCircuitBreaker({
  name: "dynamodb",
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
  rollingWindowDuration: 60000,
});
