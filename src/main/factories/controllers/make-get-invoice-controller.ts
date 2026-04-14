import { GetInvoiceController } from '@/presentation/controllers';
import { makeGetInvoiceByWorkOrderId } from '@/main/factories/use-cases';

export const makeGetInvoiceController = () => {
  return new GetInvoiceController(makeGetInvoiceByWorkOrderId());
};
