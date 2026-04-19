import { logger } from "@/infra/observability";
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
        logger.error({ err }, "DLQ Monitor check failed"),
      );
    }, intervalMs);
    logger.info(
      { dlqCount: this.dlqUrls.length, intervalMs },
      "DLQ Monitor started",
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
          logger.error(
            { dlq: dlq.name, messageCount: count },
            "DLQ has messages awaiting review",
          );
        }
      } catch (error) {
        logger.error({ err: error, dlq: dlq.name }, "Failed to check DLQ");
      }
    }
  }
}
