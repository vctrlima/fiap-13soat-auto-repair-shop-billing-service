import { Counter, Histogram, Meter, metrics } from "@opentelemetry/api";

const meter: Meter = metrics.getMeter("billing-service");

export const httpRequestCounter: Counter = meter.createCounter(
  "http.server.request.count",
  { description: "Total number of HTTP requests" },
);

export const httpRequestDuration: Histogram = meter.createHistogram(
  "http.request.duration",
  { description: "HTTP request duration in milliseconds", unit: "ms" },
);

export const invoiceCreatedCounter: Counter = meter.createCounter(
  "business.invoice.created",
  { description: "Total number of invoices created" },
);

export const paymentProcessedCounter: Counter = meter.createCounter(
  "business.payment.processed",
  { description: "Total number of payments processed" },
);

export const paymentFailedCounter: Counter = meter.createCounter(
  "business.payment.failed",
  { description: "Total number of payment failures" },
);

export const refundProcessedCounter: Counter = meter.createCounter(
  "business.refund.processed",
  { description: "Total number of refunds processed" },
);

export const messagePublishedCounter: Counter = meter.createCounter(
  "messaging.message.published",
  { description: "Total messages published to SNS" },
);

export const messageConsumedCounter: Counter = meter.createCounter(
  "messaging.message.consumed",
  { description: "Total messages consumed from SQS" },
);

export const dbQueryDuration: Histogram = meter.createHistogram(
  "db.query.duration",
  { description: "DynamoDB query duration in milliseconds", unit: "ms" },
);

export const dbQueryErrorCounter: Counter = meter.createCounter(
  "db.query.error.count",
  { description: "Total number of DynamoDB query errors" },
);
