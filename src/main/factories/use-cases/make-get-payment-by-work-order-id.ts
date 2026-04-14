import { DbGetPaymentByWorkOrderId } from '@/application/use-cases';
import { DynamoPaymentRepository } from '@/infra/db';

export const makeGetPaymentByWorkOrderId = () => {
  const paymentRepository = new DynamoPaymentRepository();
  return new DbGetPaymentByWorkOrderId(paymentRepository);
};
