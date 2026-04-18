import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  SERVER_PORT: z.coerce.number().default(3003),
  SERVER_HOST: z.string().default("http://localhost:3003"),
  AWS_REGION: z.string().default("us-east-2"),
  AWS_ENDPOINT_URL: z.string().optional(),
  SNS_PAYMENT_EVENTS_TOPIC_ARN: z
    .string()
    .default("arn:aws:sns:us-east-2:000000000000:payment-events"),
  SQS_BILLING_WORK_ORDER_QUEUE_URL: z
    .string()
    .default("http://localhost:4566/000000000000/billing-work-order-queue"),
  DYNAMODB_INVOICES_TABLE: z.string().default("Invoices"),
  DYNAMODB_PAYMENTS_TABLE: z.string().default("Payments"),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export default {
  port: parsed.SERVER_PORT,
  host: parsed.SERVER_HOST,
  awsRegion: parsed.AWS_REGION,
  awsEndpoint: parsed.AWS_ENDPOINT_URL,
  snsPaymentEventsTopicArn: parsed.SNS_PAYMENT_EVENTS_TOPIC_ARN,
  sqsBillingWorkOrderQueueUrl: parsed.SQS_BILLING_WORK_ORDER_QUEUE_URL,
  dynamodbInvoicesTable: parsed.DYNAMODB_INVOICES_TABLE,
  dynamodbPaymentsTable: parsed.DYNAMODB_PAYMENTS_TABLE,
  mercadoPagoAccessToken: parsed.MERCADO_PAGO_ACCESS_TOKEN,
  corsOrigin: parsed.CORS_ORIGIN,
};
