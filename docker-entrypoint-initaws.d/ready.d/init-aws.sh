#!/bin/bash
# MiniStack init script — creates SNS topics, SQS queues, DynamoDB tables for Billing Service
set -e

ENDPOINT="http://localhost:4566"
REGION="us-east-2"
ACCOUNT="000000000000"

echo "Creating SNS topics..."
aws --endpoint-url=$ENDPOINT --region=$REGION sns create-topic --name work-order-events
aws --endpoint-url=$ENDPOINT --region=$REGION sns create-topic --name payment-events

echo "Creating SQS queues..."
aws --endpoint-url=$ENDPOINT --region=$REGION sqs create-queue --queue-name billing-work-order-queue-dlq

aws --endpoint-url=$ENDPOINT --region=$REGION sqs create-queue --queue-name billing-work-order-queue \
  --attributes '{"RedrivePolicy":"{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-2:000000000000:billing-work-order-queue-dlq\",\"maxReceiveCount\":\"3\"}"}'

echo "Creating SNS→SQS subscriptions..."
aws --endpoint-url=$ENDPOINT --region=$REGION sns subscribe \
  --topic-arn arn:aws:sns:$REGION:$ACCOUNT:work-order-events \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:$REGION:$ACCOUNT:billing-work-order-queue

echo "Creating DynamoDB tables..."
aws --endpoint-url=$ENDPOINT --region=$REGION dynamodb create-table \
  --table-name Invoices \
  --attribute-definitions \
    AttributeName=workOrderId,AttributeType=S \
    AttributeName=invoiceId,AttributeType=S \
  --key-schema \
    AttributeName=workOrderId,KeyType=HASH \
    AttributeName=invoiceId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=$ENDPOINT --region=$REGION dynamodb create-table \
  --table-name Payments \
  --attribute-definitions \
    AttributeName=workOrderId,AttributeType=S \
    AttributeName=paymentId,AttributeType=S \
  --key-schema \
    AttributeName=workOrderId,KeyType=HASH \
    AttributeName=paymentId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

echo "Billing Service AWS resources created."
