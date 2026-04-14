import { DbGetInvoiceByWorkOrderId } from '@/application/use-cases';
import { DynamoInvoiceRepository } from '@/infra/db';

export const makeGetInvoiceByWorkOrderId = () => {
  const invoiceRepository = new DynamoInvoiceRepository();
  return new DbGetInvoiceByWorkOrderId(invoiceRepository);
};
