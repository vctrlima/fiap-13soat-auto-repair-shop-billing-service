import { DbProcessPayment } from '@/application/use-cases';
import { DynamoPaymentRepository } from '@/infra/db';
import { SnsEventPublisher } from '@/infra/messaging';
import env from '@/main/config/env';

export const makeProcessPayment = () => {
  const paymentRepository = new DynamoPaymentRepository();
  const eventPublisher = new SnsEventPublisher(env.snsPaymentEventsTopicArn, env.awsRegion, env.awsEndpoint);
  return new DbProcessPayment(paymentRepository, eventPublisher);
};
