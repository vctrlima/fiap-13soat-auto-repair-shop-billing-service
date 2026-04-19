import { EventConsumer } from "@/application/protocols/messaging";
import { DomainEvent } from "@/domain/events";
import {
  logger,
  messageConsumedCounter,
  messageProcessingFailedCounter,
} from "@/infra/observability";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { context, propagation } from "@opentelemetry/api";

export type MessageHandler = (event: DomainEvent) => Promise<void>;

export class SqsEventConsumer implements EventConsumer {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private readonly handler: MessageHandler;
  private readonly allowedTopicArns: string[];
  private running = false;

  constructor(
    queueUrl: string,
    region: string,
    handler: MessageHandler,
    endpoint?: string,
    allowedTopicArns?: string[],
  ) {
    this.queueUrl = queueUrl;
    this.handler = handler;
    this.allowedTopicArns = allowedTopicArns ?? [];
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

        if (!response.Messages) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        if (response.Messages) {
          for (const message of response.Messages) {
            try {
              const body = JSON.parse(message.Body ?? "{}");

              if (
                body.TopicArn &&
                this.allowedTopicArns.length > 0 &&
                !this.allowedTopicArns.includes(body.TopicArn)
              ) {
                logger.warn(
                  { topicArn: body.TopicArn, queue: this.queueUrl },
                  "Rejected message from unexpected topic",
                );
                if (message.ReceiptHandle) {
                  await this.sqsClient.send(
                    new DeleteMessageCommand({
                      QueueUrl: this.queueUrl,
                      ReceiptHandle: message.ReceiptHandle,
                    }),
                  );
                }
                continue;
              }

              const carrier: Record<string, string> = {};
              const traceparent = body.MessageAttributes?.traceparent?.Value;
              if (traceparent) {
                carrier.traceparent = traceparent;
              }
              const parentContext = propagation.extract(
                context.active(),
                carrier,
              );

              const event: DomainEvent = body.Message
                ? JSON.parse(body.Message)
                : body;

              await context.with(parentContext, () => this.handler(event));
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
              logger.error(
                { err: error, queue: this.queueUrl },
                "Error processing SQS message",
              );
            }
          }
        }
      } catch (error) {
        logger.error(
          { err: error, queue: this.queueUrl },
          "Error polling SQS queue",
        );
        if (this.running) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
  }
}
