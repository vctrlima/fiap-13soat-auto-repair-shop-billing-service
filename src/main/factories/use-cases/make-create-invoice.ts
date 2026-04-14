import { DbCreateInvoice } from '@/application/use-cases';
import { DynamoInvoiceRepository } from '@/infra/db';

export const makeCreateInvoice = () => {
  const invoiceRepository = new DynamoInvoiceRepository();
  return new DbCreateInvoice(invoiceRepository);
};
