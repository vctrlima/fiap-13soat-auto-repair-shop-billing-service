import { randomUUID } from 'node:crypto';
import { ProcessRefundRepository } from '@/application/protocols/db';
import { EventPublisher } from '@/application/protocols/messaging';
import { DomainEvent, PaymentEventData } from '@/domain/events';
import { ProcessRefund } from '@/domain/use-cases';
import { refundProcessedCounter } from '@/infra/observability';

export class DbProcessRefund implements ProcessRefund {
  constructor(
    private readonly processRefundRepository: ProcessRefundRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async refund(params: ProcessRefund.Params): Promise<ProcessRefund.Result> {
    const payment = await this.processRefundRepository.refund(params);
    refundProcessedCounter.add(1);

    const event: DomainEvent<PaymentEventData> = {
      eventType: 'RefundCompleted',
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
      },
    };
    await this.eventPublisher.publish(event);
    return payment;
  }
}
