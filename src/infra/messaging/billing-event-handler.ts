import { DomainEvent, WorkOrderEventData } from '@/domain/events';
import { CreateInvoice, UpdateInvoiceStatus, ProcessRefund, GetInvoiceByWorkOrderId } from '@/domain/use-cases';

export class BillingEventHandler {
  constructor(
    private readonly createInvoice: CreateInvoice,
    private readonly getInvoice: GetInvoiceByWorkOrderId,
    private readonly updateInvoiceStatus: UpdateInvoiceStatus,
    private readonly processRefund: ProcessRefund,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'WorkOrderApproved':
        await this.handleWorkOrderApproved(event as DomainEvent<WorkOrderEventData>);
        break;
      case 'WorkOrderCanceled':
        await this.handleWorkOrderCanceled(event as DomainEvent<WorkOrderEventData>);
        break;
      default:
        console.log(`[BillingEventHandler] Ignoring event type: ${event.eventType}`);
    }
  }

  private async handleWorkOrderApproved(event: DomainEvent<WorkOrderEventData>): Promise<void> {
    const { workOrderId, customerId, budget, services, parts } = event.data;
    console.log(`[BillingEventHandler] WorkOrderApproved — creating invoice for WO ${workOrderId}`);

    await this.createInvoice.create({
      workOrderId,
      customerId,
      amount: budget ?? 0,
      services: (services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        quantity: s.quantity,
        unitPrice: s.price,
        totalPrice: s.price * s.quantity,
      })),
      parts: (parts ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.price,
        totalPrice: p.price * p.quantity,
      })),
    });
  }

  private async handleWorkOrderCanceled(event: DomainEvent<WorkOrderEventData>): Promise<void> {
    const { workOrderId } = event.data;
    console.log(`[BillingEventHandler] WorkOrderCanceled — canceling invoice for WO ${workOrderId}`);

    const invoice = await this.getInvoice.getByWorkOrderId({ workOrderId });
    if (!invoice) {
      console.log(`[BillingEventHandler] No invoice found for WO ${workOrderId}, skipping`);
      return;
    }

    if (invoice.status === 'PAID') {
      await this.processRefund.refund({ workOrderId, reason: 'Work order canceled' });
    }

    await this.updateInvoiceStatus.updateStatus({
      workOrderId,
      invoiceId: invoice.invoiceId,
      status: 'CANCELED',
    });
  }
}
