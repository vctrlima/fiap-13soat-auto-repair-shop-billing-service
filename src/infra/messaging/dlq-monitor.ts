import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";

export class DlqMonitor {
  private readonly sqsClient: SQSClient;
  private readonly dlqUrls: { name: string; url: string }[];
  private intervalId?: NodeJS.Timeout;

  constructor(
    region: string,
    dlqUrls: { name: string; url: string }[],
    endpoint?: string,
  ) {
    this.dlqUrls = dlqUrls;
    this.sqsClient = new SQSClient({
      region,
      ...(endpoint ? { endpoint } : {}),
    });
  }

  start(intervalMs = 60_000): void {
    this.intervalId = setInterval(() => {
      this.checkDlqs().catch((err) =>
        console.error("[DLQ Monitor] Error:", err),
      );
    }, intervalMs);
    console.log(
      `[DLQ Monitor] Started — checking ${this.dlqUrls.length} DLQs every ${intervalMs / 1000}s`,
    );
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  async checkDlqs(): Promise<void> {
    for (const dlq of this.dlqUrls) {
      try {
        const response = await this.sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: dlq.url,
            AttributeNames: ["ApproximateNumberOfMessages"],
          }),
        );

        const count = parseInt(
          response.Attributes?.ApproximateNumberOfMessages ?? "0",
          10,
        );

        if (count > 0) {
          console.error(
            `[DLQ Monitor] ALERT: ${dlq.name} has ${count} messages awaiting review`,
          );
        }
      } catch (error) {
        console.error(`[DLQ Monitor] Failed to check ${dlq.name}:`, error);
      }
    }
  }
}
