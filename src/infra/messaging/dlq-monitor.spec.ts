const mockSend = jest.fn();
jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  GetQueueAttributesCommand: jest.fn().mockImplementation((params) => params),
}));

import { DlqMonitor } from "@/infra/messaging/dlq-monitor";

describe("DlqMonitor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const dlqUrls = [
    { name: "billing-work-order-dlq", url: "http://localhost:4566/queue/dlq1" },
  ];

  it("should create instance with endpoint", () => {
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    expect(monitor).toBeDefined();
  });

  it("should create instance without endpoint", () => {
    const monitor = new DlqMonitor("us-east-2", dlqUrls);
    expect(monitor).toBeDefined();
  });

  it("should log alert when DLQ has messages", async () => {
    mockSend.mockResolvedValue({
      Attributes: { ApproximateNumberOfMessages: "5" },
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("billing-work-order-dlq has 5 messages"),
    );
    errorSpy.mockRestore();
  });

  it("should not log when DLQ is empty", async () => {
    mockSend.mockResolvedValue({
      Attributes: { ApproximateNumberOfMessages: "0" },
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should handle missing attributes", async () => {
    mockSend.mockResolvedValue({ Attributes: {} });
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should handle SQS errors gracefully", async () => {
    mockSend.mockRejectedValue(new Error("SQS Error"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to check billing-work-order-dlq"),
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("should start and stop polling", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    monitor.start(30_000);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Started"));
    monitor.stop();
    logSpy.mockRestore();
  });

  it("should handle stop when not started", () => {
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    expect(() => monitor.stop()).not.toThrow();
  });
});
