import { randomUUID } from 'node:crypto';
import { ProcessPaymentRepository } from '@/application/protocols/db';
import { EventPublisher } from '@/application/protocols/messaging';
import { DomainEvent, PaymentEventData } from '@/domain/events';
import { ProcessPayment } from '@/domain/use-cases';
import { paymentProcessedCounter, paymentFailedCounter } from '@/infra/observability';

export class DbProcessPayment implements ProcessPayment {
  constructor(
    private readonly processPaymentRepository: ProcessPaymentRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async process(params: ProcessPayment.Params): Promise<ProcessPayment.Result> {
    const payment = await this.processPaymentRepository.process(params);

    const eventType = payment.status === 'COMPLETED' ? 'PaymentCompleted' : 'PaymentFailed';
    if (payment.status === 'COMPLETED') {
      paymentProcessedCounter.add(1);
    } else {
      paymentFailedCounter.add(1);
    }

    const event: DomainEvent<PaymentEventData> = {
      eventType,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'billing-service',
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
    return payment;
  }
}
