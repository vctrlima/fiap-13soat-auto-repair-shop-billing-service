import { DbProcessRefund } from '@/application/use-cases';
import { DynamoPaymentRepository } from '@/infra/db';
import { SnsEventPublisher } from '@/infra/messaging';
import env from '@/main/config/env';

export const makeProcessRefund = () => {
  const paymentRepository = new DynamoPaymentRepository();
  const eventPublisher = new SnsEventPublisher(env.snsPaymentEventsTopicArn, env.awsRegion, env.awsEndpoint);
  return new DbProcessRefund(paymentRepository, eventPublisher);
};
