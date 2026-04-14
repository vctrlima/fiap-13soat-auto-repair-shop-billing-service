import { randomUUID } from 'node:crypto';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  ProcessPaymentRepository,
  GetPaymentByWorkOrderIdRepository,
  ProcessRefundRepository,
} from '@/application/protocols/db';
import { Payment } from '@/domain/entities';
import { dynamodb } from '@/infra/db/dynamodb-client';
import { dbQueryDuration, dbQueryErrorCounter } from '@/infra/observability';

const TABLE_NAME = process.env.DYNAMODB_PAYMENTS_TABLE || 'Payments';

export class DynamoPaymentRepository
  implements ProcessPaymentRepository, GetPaymentByWorkOrderIdRepository, ProcessRefundRepository
{
  async process(params: ProcessPaymentRepository.Params): Promise<ProcessPaymentRepository.Result> {
    const now = new Date().toISOString();
    const payment: Payment = {
      workOrderId: params.workOrderId,
      paymentId: randomUUID(),
      invoiceId: params.invoiceId,
      amount: params.amount,
      method: params.method,
      status: 'COMPLETED',
      createdAt: now,
    };

    const start = performance.now();
    try {
      await dynamodb.send(
        new PutCommand({ TableName: TABLE_NAME, Item: payment }),
      );
      dbQueryDuration.record(performance.now() - start, { operation: 'putPayment' });
      return payment;
    } catch (error) {
      dbQueryErrorCounter.add(1, { operation: 'putPayment' });
      throw error;
    }
  }

  async getByWorkOrderId(params: GetPaymentByWorkOrderIdRepository.Params): Promise<GetPaymentByWorkOrderIdRepository.Result> {
    const start = performance.now();
    try {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'workOrderId = :woid',
          ExpressionAttributeValues: { ':woid': params.workOrderId },
        }),
      );
      dbQueryDuration.record(performance.now() - start, { operation: 'queryPayments' });
      return (result.Items || []) as Payment[];
    } catch (error) {
      dbQueryErrorCounter.add(1, { operation: 'queryPayments' });
      throw error;
    }
  }

  async refund(params: ProcessRefundRepository.Params): Promise<ProcessRefundRepository.Result> {
    const payments = await this.getByWorkOrderId({ workOrderId: params.workOrderId });
    const latestPayment = payments.find((p) => p.status === 'COMPLETED');
    if (!latestPayment) {
      throw new Error(`No completed payment found for workOrderId ${params.workOrderId}`);
    }

    const now = new Date().toISOString();
    const start = performance.now();
    try {
      const result = await dynamodb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { workOrderId: params.workOrderId, paymentId: latestPayment.paymentId },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'REFUNDED', ':updatedAt': now },
          ReturnValues: 'ALL_NEW',
        }),
      );
      dbQueryDuration.record(performance.now() - start, { operation: 'refundPayment' });
      return result.Attributes as Payment;
    } catch (error) {
      dbQueryErrorCounter.add(1, { operation: 'refundPayment' });
      throw error;
    }
  }
}
