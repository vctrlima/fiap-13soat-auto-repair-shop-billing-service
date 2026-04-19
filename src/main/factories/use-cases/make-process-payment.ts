import { DbProcessPayment } from "@/application/use-cases";
import { DynamoPaymentRepository } from "@/infra/db";
import { MercadoPagoPaymentGateway } from "@/infra/gateway";
import { DynamoOutboxEventPublisher } from "@/infra/messaging/dynamo-outbox-event-publisher";
import env from "@/main/config/env";

export const makeProcessPayment = () => {
  const paymentRepository = new DynamoPaymentRepository();
  const eventPublisher = new DynamoOutboxEventPublisher();
  const paymentGateway = env.mercadoPagoAccessToken
    ? new MercadoPagoPaymentGateway(env.mercadoPagoAccessToken)
    : undefined;
  return new DbProcessPayment(
    paymentRepository,
    eventPublisher,
    paymentGateway,
  );
};
