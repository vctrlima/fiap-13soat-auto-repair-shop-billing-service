import "./infra/observability/tracing";

import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { BillingEventHandler, SqsEventConsumer } from "./infra/messaging";
import { DlqMonitor } from "./infra/messaging/dlq-monitor";
import { DynamoOutboxProcessor } from "./infra/messaging/dynamo-outbox-processor";
import { SnsEventPublisher } from "./infra/messaging/sns-event-publisher";
import {
  correlationFields,
  getRequestContext,
  httpRequestCounter,
  httpRequestDuration,
} from "./infra/observability";
import { app } from "./main/config/app";
import env from "./main/config/env";
import {
  makeCreateInvoice,
  makeGetInvoiceByWorkOrderId,
  makeProcessRefund,
  makeUpdateInvoiceStatus,
} from "./main/factories/use-cases";

const host = process.env.HOST ?? "localhost";
const port = Number(env.port);

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
        };
      },
    },
  },
  requestIdHeader: "x-request-id",
  genReqId: () => randomUUID(),
});

server.addHook("onRequest", async (request) => {
  const ctx = getRequestContext(request.id as string);
  request.log = request.log.child(correlationFields(ctx));
  (request as any).__startTime = process.hrtime.bigint();
});

server.addHook("onResponse", async (request, reply) => {
  const startTime = (request as any).__startTime as bigint | undefined;
  const durationMs = startTime
    ? Number(process.hrtime.bigint() - startTime) / 1_000_000
    : 0;

  const attributes = {
    "http.method": request.method,
    "http.route": request.routeOptions?.url || request.url,
    "http.status_code": reply.statusCode,
  };

  httpRequestCounter.add(1, attributes);
  httpRequestDuration.record(durationMs, attributes);
});

server.register(app);

const billingEventHandler = new BillingEventHandler(
  makeCreateInvoice(),
  makeGetInvoiceByWorkOrderId(),
  makeUpdateInvoiceStatus(),
  makeProcessRefund(),
);

const workOrderConsumer = new SqsEventConsumer(
  env.sqsBillingWorkOrderQueueUrl,
  env.awsRegion,
  (event) => billingEventHandler.handle(event),
  env.awsEndpoint,
  [env.snsWorkOrderEventsTopicArn],
);

const dlqMonitor = new DlqMonitor(
  env.awsRegion,
  [{ name: "billing-work-order-dlq", url: env.sqsBillingWorkOrderDlqUrl }],
  env.awsEndpoint,
);

const outboxProcessor = new DynamoOutboxProcessor(
  new SnsEventPublisher(
    env.snsPaymentEventsTopicArn,
    env.awsRegion,
    env.awsEndpoint,
  ),
);

server.listen({ port, host }, (error) => {
  if (error) {
    server.log.error(error);
    process.exit(1);
  } else {
    console.log(`[READY] http://${host}:${port}`);
    workOrderConsumer
      .start()
      .then(() => console.log("[SQS] Work-order event consumer started"));
    dlqMonitor.start();
    outboxProcessor.start();
  }
});

const shutdown = async () => {
  console.log("[SHUTDOWN] Stopping consumers...");
  dlqMonitor.stop();
  outboxProcessor.stop();
  await workOrderConsumer.stop();
  await server.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
