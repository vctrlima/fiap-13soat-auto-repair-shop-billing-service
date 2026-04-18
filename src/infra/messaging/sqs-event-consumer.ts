import { EventConsumer } from "@/application/protocols/messaging";
import { DomainEvent } from "@/domain/events";
import {
  messageConsumedCounter,
  messageProcessingFailedCounter,
} from "@/infra/observability";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

export type MessageHandler = (event: DomainEvent) => Promise<void>;

export class SqsEventConsumer implements EventConsumer {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private readonly handler: MessageHandler;
  private running = false;

  constructor(
    queueUrl: string,
    region: string,
    handler: MessageHandler,
    endpoint?: string,
  ) {
    this.queueUrl = queueUrl;
    this.handler = handler;
    this.sqsClient = new SQSClient({
      region,
      ...(endpoint ? { endpoint } : {}),
    });
  }

  async start(): Promise<void> {
    this.running = true;
    this.poll();
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        });
        const response = await this.sqsClient.send(command);

        if (response.Messages) {
          for (const message of response.Messages) {
            try {
              const body = JSON.parse(message.Body ?? "{}");
              const event: DomainEvent = body.Message
                ? JSON.parse(body.Message)
                : body;
              await this.handler(event);
              messageConsumedCounter.add(1, { eventType: event.eventType });

              if (message.ReceiptHandle) {
                await this.sqsClient.send(
                  new DeleteMessageCommand({
                    QueueUrl: this.queueUrl,
                    ReceiptHandle: message.ReceiptHandle,
                  }),
                );
              }
            } catch (error) {
              messageProcessingFailedCounter.add(1, { queue: this.queueUrl });
              console.error("Error processing SQS message:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error polling SQS queue:", error);
        if (this.running) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
  }
}
