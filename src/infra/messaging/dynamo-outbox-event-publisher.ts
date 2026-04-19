import { EventPublisher } from "@/application/protocols/messaging";
import { DomainEvent } from "@/domain/events";
import { dynamodb } from "@/infra/db/dynamodb-client";
import { messagePublishedCounter } from "@/infra/observability";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_OUTBOX_TABLE || "OutboxEvents";

/**
 * Writes events to a DynamoDB outbox table instead of publishing directly to SNS.
 * The OutboxProcessor polls the table and publishes to SNS asynchronously.
 */
export class DynamoOutboxEventPublisher implements EventPublisher {
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          eventId: event.eventId,
          eventType: event.eventType,
          payload: JSON.stringify(event),
          published: false,
          createdAt: new Date().toISOString(),
        },
      }),
    );
    messagePublishedCounter.add(1, { eventType: event.eventType });
  }
}
