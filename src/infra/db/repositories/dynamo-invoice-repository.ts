import { randomUUID } from 'node:crypto';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  CreateInvoiceRepository,
  GetInvoiceByWorkOrderIdRepository,
  UpdateInvoiceStatusRepository,
} from '@/application/protocols/db';
import { Invoice } from '@/domain/entities';
import { dynamodb } from '@/infra/db/dynamodb-client';
import { dbQueryDuration, dbQueryErrorCounter } from '@/infra/observability';

const TABLE_NAME = process.env.DYNAMODB_INVOICES_TABLE || 'Invoices';

export class DynamoInvoiceRepository
  implements CreateInvoiceRepository, GetInvoiceByWorkOrderIdRepository, UpdateInvoiceStatusRepository
{
  async create(params: CreateInvoiceRepository.Params): Promise<CreateInvoiceRepository.Result> {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      workOrderId: params.workOrderId,
      invoiceId: randomUUID(),
      customerId: params.customerId,
      amount: params.amount,
      status: 'PENDING',
      services: params.services,
      parts: params.parts,
      createdAt: now,
    };

    const start = performance.now();
    try {
      await dynamodb.send(
        new PutCommand({ TableName: TABLE_NAME, Item: invoice }),
      );
      dbQueryDuration.record(performance.now() - start, { operation: 'putInvoice' });
      return invoice;
    } catch (error) {
      dbQueryErrorCounter.add(1, { operation: 'putInvoice' });
      throw error;
    }
  }

  async getByWorkOrderId(params: GetInvoiceByWorkOrderIdRepository.Params): Promise<GetInvoiceByWorkOrderIdRepository.Result> {
    const start = performance.now();
    try {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'workOrderId = :woid',
          ExpressionAttributeValues: { ':woid': params.workOrderId },
          Limit: 1,
          ScanIndexForward: false,
        }),
      );
      dbQueryDuration.record(performance.now() - start, { operation: 'queryInvoice' });
      if (!result.Items || result.Items.length === 0) {
        return null as any;
      }
      return result.Items[0] as Invoice;
    } catch (error) {
      dbQueryErrorCounter.add(1, { operation: 'queryInvoice' });
      throw error;
    }
  }

  async updateStatus(params: UpdateInvoiceStatusRepository.Params): Promise<UpdateInvoiceStatusRepository.Result> {
    const now = new Date().toISOString();
    const start = performance.now();
    try {
      const result = await dynamodb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { workOrderId: params.workOrderId, invoiceId: params.invoiceId },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': params.status, ':updatedAt': now },
          ReturnValues: 'ALL_NEW',
        }),
      );
      dbQueryDuration.record(performance.now() - start, { operation: 'updateInvoiceStatus' });
      return result.Attributes as Invoice;
    } catch (error) {
      dbQueryErrorCounter.add(1, { operation: 'updateInvoiceStatus' });
      throw error;
    }
  }
}
