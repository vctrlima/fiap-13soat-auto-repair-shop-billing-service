import { dynamodb } from "@/infra/db/dynamodb-client";
import { logger } from "@/infra/observability";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SnsEventPublisher } from "./sns-event-publisher";

const TABLE_NAME = process.env.DYNAMODB_OUTBOX_TABLE || "OutboxEvents";

export class DynamoOutboxProcessor {
  private running = false;
  private intervalId?: NodeJS.Timeout;

  constructor(private readonly publisher: SnsEventPublisher) {}

  start(intervalMs = 5_000): void {
    this.running = true;
    this.intervalId = setInterval(() => {
      this.processOutbox().catch((err) =>
        logger.error({ err }, "Outbox processing failed"),
      );
    }, intervalMs);
    logger.info({ intervalMs }, "DynamoDB Outbox processor started");
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  async processOutbox(): Promise<void> {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "published-createdAt-index",
        KeyConditionExpression: "published = :f",
        ExpressionAttributeValues: { ":f": false },
        Limit: 50,
      }),
    );

    for (const item of result.Items ?? []) {
      try {
        const event = JSON.parse(item.payload as string);
        await this.publisher.publish(event);
        await dynamodb.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { eventId: item.eventId },
            UpdateExpression: "SET published = :t, publishedAt = :now",
            ExpressionAttributeValues: {
              ":t": true,
              ":now": new Date().toISOString(),
            },
          }),
        );
      } catch (err) {
        logger.error(
          { err, eventId: item.eventId, eventType: item.eventType },
          "Failed to publish outbox event, will retry",
        );
      }
    }
  }
}
