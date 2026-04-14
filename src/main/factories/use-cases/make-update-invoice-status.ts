import { DbUpdateInvoiceStatus } from '@/application/use-cases';
import { DynamoInvoiceRepository } from '@/infra/db';

export const makeUpdateInvoiceStatus = () => {
  const invoiceRepository = new DynamoInvoiceRepository();
  return new DbUpdateInvoiceStatus(invoiceRepository);
};
