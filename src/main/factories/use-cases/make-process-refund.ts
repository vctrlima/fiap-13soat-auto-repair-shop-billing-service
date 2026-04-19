import { DbProcessRefund } from "@/application/use-cases";
import { DynamoPaymentRepository } from "@/infra/db";
import { DynamoOutboxEventPublisher } from "@/infra/messaging/dynamo-outbox-event-publisher";

export const makeProcessRefund = () => {
  const paymentRepository = new DynamoPaymentRepository();
  const eventPublisher = new DynamoOutboxEventPublisher();
  return new DbProcessRefund(paymentRepository, eventPublisher);
};
