const mockSend = jest.fn();
jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  GetQueueAttributesCommand: jest.fn().mockImplementation((params) => params),
}));

jest.mock("@/infra/observability", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

import { DlqMonitor } from "@/infra/messaging/dlq-monitor";
import { logger as mockLogger } from "@/infra/observability";

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
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ dlq: "billing-work-order-dlq", messageCount: 5 }),
      expect.any(String),
    );
  });

  it("should not log when DLQ is empty", async () => {
    mockSend.mockResolvedValue({
      Attributes: { ApproximateNumberOfMessages: "0" },
    });
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should handle missing attributes", async () => {
    mockSend.mockResolvedValue({ Attributes: {} });
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should handle SQS errors gracefully", async () => {
    mockSend.mockRejectedValue(new Error("SQS Error"));
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    await monitor.checkDlqs();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ dlq: "billing-work-order-dlq" }),
      expect.any(String),
    );
  });

  it("should start and stop polling", () => {
    const monitor = new DlqMonitor(
      "us-east-2",
      dlqUrls,
      "http://localhost:4566",
    );
    monitor.start(30_000);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ dlqCount: 1, intervalMs: 30_000 }),
      expect.any(String),
    );
    monitor.stop();
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
