import { DbProcessPayment } from "@/application/use-cases";
import { DynamoPaymentRepository } from "@/infra/db";
import { MercadoPagoPaymentGateway } from "@/infra/gateway";
import { SnsEventPublisher } from "@/infra/messaging";
import env from "@/main/config/env";

export const makeProcessPayment = () => {
  const paymentRepository = new DynamoPaymentRepository();
  const eventPublisher = new SnsEventPublisher(
    env.snsPaymentEventsTopicArn,
    env.awsRegion,
    env.awsEndpoint,
  );
  const paymentGateway = env.mercadoPagoAccessToken
    ? new MercadoPagoPaymentGateway(env.mercadoPagoAccessToken)
    : undefined;
  return new DbProcessPayment(
    paymentRepository,
    eventPublisher,
    paymentGateway,
  );
};
