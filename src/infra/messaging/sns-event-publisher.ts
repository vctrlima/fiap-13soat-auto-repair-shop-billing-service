import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventPublisher } from '@/application/protocols/messaging';
import { DomainEvent } from '@/domain/events';
import { messagePublishedCounter } from '@/infra/observability';

export class SnsEventPublisher implements EventPublisher {
  private readonly snsClient: SNSClient;
  private readonly topicArn: string;

  constructor(topicArn: string, region: string, endpoint?: string) {
    this.topicArn = topicArn;
    this.snsClient = new SNSClient({
      region,
      ...(endpoint ? { endpoint } : {}),
    });
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(event),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: event.eventType,
        },
        source: {
          DataType: 'String',
          StringValue: event.source,
        },
      },
    });
    await this.snsClient.send(command);
    messagePublishedCounter.add(1, { eventType: event.eventType });
  }
}
