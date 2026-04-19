import { DatabaseCircuitBreaker } from "@/infra/circuit-breaker";

const makeSut = (
  options?: ConstructorParameters<typeof DatabaseCircuitBreaker>[0],
) =>
  new DatabaseCircuitBreaker({
    name: "test",
    volumeThreshold: 3,
    errorThresholdPercentage: 50,
    resetTimeout: 100,
    rollingWindowDuration: 60000,
    ...options,
  });

describe("DatabaseCircuitBreaker", () => {
  beforeEach(() => jest.restoreAllMocks());

  it("should start in CLOSED state", () => {
    const cb = makeSut();
    expect(cb.currentState).toBe("CLOSED");
    expect(cb.isOpen).toBe(false);
  });

  it("should execute action successfully when CLOSED", async () => {
    const cb = makeSut();
    const result = await cb.execute(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
    expect(cb.currentState).toBe("CLOSED");
  });

  it("should propagate errors from the action", async () => {
    const cb = makeSut();
    await expect(
      cb.execute(() => Promise.reject(new Error("db error"))),
    ).rejects.toThrow("db error");
  });

  it("should remain CLOSED when failures are below volume threshold", async () => {
    const cb = makeSut({ volumeThreshold: 5 });
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    }
    expect(cb.currentState).toBe("CLOSED");
  });

  it("should trip to OPEN when failure rate exceeds threshold", async () => {
    const cb = makeSut({ volumeThreshold: 3, errorThresholdPercentage: 50 });
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    }
    expect(cb.currentState).toBe("OPEN");
    expect(cb.isOpen).toBe(true);
  });

  it("should not trip when failure rate is below threshold", async () => {
    const cb = makeSut({ volumeThreshold: 3, errorThresholdPercentage: 50 });
    await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    await cb.execute(() => Promise.resolve("ok"));
    await cb.execute(() => Promise.resolve("ok"));
    expect(cb.currentState).toBe("CLOSED");
  });

  it("should reject immediately when OPEN", async () => {
    const cb = makeSut({ volumeThreshold: 3, resetTimeout: 60000 });
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    }
    expect(cb.currentState).toBe("OPEN");

    await expect(cb.execute(() => Promise.resolve("ok"))).rejects.toThrow(
      "Circuit breaker [test] is OPEN",
    );
  });

  it("should transition to HALF_OPEN after resetTimeout", async () => {
    const cb = makeSut({ volumeThreshold: 3, resetTimeout: 50 });
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    }
    expect(cb.currentState).toBe("OPEN");

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 100);

    const result = await cb.execute(() => Promise.resolve("probe-ok"));
    expect(result).toBe("probe-ok");
    expect(cb.currentState).toBe("CLOSED");
  });

  it("should go back to OPEN if half-open probe fails", async () => {
    const cb = makeSut({ volumeThreshold: 3, resetTimeout: 50 });
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    }
    expect(cb.currentState).toBe("OPEN");

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 100);

    await expect(
      cb.execute(() => Promise.reject(new Error("still failing"))),
    ).rejects.toThrow("still failing");
    expect(cb.currentState).toBe("OPEN");
  });

  it("should reset rolling window counters when window expires", async () => {
    const cb = makeSut({
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      rollingWindowDuration: 100,
    });

    await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 200);

    await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});
    expect(cb.currentState).toBe("CLOSED");
  });

  it("should use default options when none provided", () => {
    const cb = new DatabaseCircuitBreaker();
    expect(cb.currentState).toBe("CLOSED");
  });
});
