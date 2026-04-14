import * as dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.SERVER_PORT || 3003,
  host: process.env.SERVER_HOST || 'http://localhost:3003',
  awsRegion: process.env.AWS_REGION || 'us-east-2',
  awsEndpoint: process.env.AWS_ENDPOINT_URL || undefined,
  snsPaymentEventsTopicArn: process.env.SNS_PAYMENT_EVENTS_TOPIC_ARN || 'arn:aws:sns:us-east-2:000000000000:payment-events',
  sqsBillingWorkOrderQueueUrl: process.env.SQS_BILLING_WORK_ORDER_QUEUE_URL || 'http://localhost:4566/000000000000/billing-work-order-queue',
  dynamodbInvoicesTable: process.env.DYNAMODB_INVOICES_TABLE || 'Invoices',
  dynamodbPaymentsTable: process.env.DYNAMODB_PAYMENTS_TABLE || 'Payments',
};
