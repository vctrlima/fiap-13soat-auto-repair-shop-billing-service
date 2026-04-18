import { ProcessPaymentRepository } from "@/application/protocols/db";
import { PaymentGateway } from "@/application/protocols/gateway";
import { EventPublisher } from "@/application/protocols/messaging";
import { DomainEvent, PaymentEventData, type EventType } from "@/domain/events";
import { ProcessPayment } from "@/domain/use-cases";
import {
  paymentFailedCounter,
  paymentProcessedCounter,
} from "@/infra/observability";
import { randomUUID } from "node:crypto";

export class DbProcessPayment implements ProcessPayment {
  constructor(
    private readonly processPaymentRepository: ProcessPaymentRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly paymentGateway?: PaymentGateway,
  ) {}

  async process(params: ProcessPayment.Params): Promise<ProcessPayment.Result> {
    let gatewayPaymentId: string | undefined;

    if (this.paymentGateway) {
      try {
        const gatewayResult = await this.paymentGateway.createPayment({
          externalReference: `${params.workOrderId}:${params.invoiceId}`,
          description: `Payment for work order ${params.workOrderId}`,
          amount: params.amount,
          method: params.method,
        });
        gatewayPaymentId = gatewayResult.gatewayPaymentId;

        if (gatewayResult.status === "rejected") {
          const payment = await this.processPaymentRepository.process({
            ...params,
            status: "FAILED",
            failureReason: `Gateway rejected: ${gatewayResult.gatewayStatus}`,
            gatewayPaymentId,
          } as any);
          paymentFailedCounter.add(1);
          await this.publishEvent("PaymentFailed", payment);
          return payment;
        }
      } catch (error: any) {
        console.error(
          "[ProcessPayment] Gateway error, falling back to internal processing:",
          error.message,
        );
      }
    }

    const payment = await this.processPaymentRepository.process(params);

    const eventType =
      payment.status === "COMPLETED" ? "PaymentCompleted" : "PaymentFailed";
    if (payment.status === "COMPLETED") {
      paymentProcessedCounter.add(1);
    } else {
      paymentFailedCounter.add(1);
    }

    await this.publishEvent(eventType, payment);
    return payment;
  }

  private async publishEvent(
    eventType: EventType,
    payment: ProcessPayment.Result,
  ): Promise<void> {
    const event: DomainEvent<PaymentEventData> = {
      eventType,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      version: "1.0",
      source: "billing-service",
      data: {
        workOrderId: payment.workOrderId,
        paymentId: payment.paymentId,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        status: payment.status,
        failureReason: payment.failureReason,
      },
    };
    await this.eventPublisher.publish(event);
  }
}
