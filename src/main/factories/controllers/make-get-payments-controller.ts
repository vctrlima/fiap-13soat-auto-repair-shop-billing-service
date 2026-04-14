import { GetPaymentsController } from '@/presentation/controllers';
import { makeGetPaymentByWorkOrderId } from '@/main/factories/use-cases';

export const makeGetPaymentsController = () => {
  return new GetPaymentsController(makeGetPaymentByWorkOrderId());
};
