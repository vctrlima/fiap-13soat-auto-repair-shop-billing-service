jest.mock("@/infra/observability", () => ({
  messagePublishedCounter: { add: jest.fn() },
}));

import { SnsEventPublisher } from "@/infra/messaging/sns-event-publisher";

const mockSend = jest.fn().mockResolvedValue({});
jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PublishCommand: jest.fn().mockImplementation((params) => params),
}));

describe("SnsEventPublisher", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should publish event to SNS", async () => {
    const sut = new SnsEventPublisher(
      "arn:aws:sns:us-east-2:000:topic",
      "us-east-2",
    );
    const event = {
      eventType: "InvoiceCreated",
      source: "billing-service",
      data: { id: "inv-1" },
    };
    await sut.publish(event as any);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ TopicArn: "arn:aws:sns:us-east-2:000:topic" }),
    );
  });

  it("should create client with endpoint", () => {
    const sut = new SnsEventPublisher(
      "arn:aws:sns:us-east-2:000:topic",
      "us-east-2",
      "http://localhost:4566",
    );
    expect(sut).toBeDefined();
  });
});
