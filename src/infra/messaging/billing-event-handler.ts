import { DomainEvent, WorkOrderEventData } from "@/domain/events";
import {
  CreateInvoice,
  GetInvoiceByWorkOrderId,
  ProcessRefund,
  UpdateInvoiceStatus,
} from "@/domain/use-cases";
import { dynamodb } from "@/infra/db/dynamodb-client";
import { logger } from "@/infra/observability";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const PROCESSED_EVENTS_TABLE =
  process.env.DYNAMODB_PROCESSED_EVENTS_TABLE || "ProcessedEvents";

export class BillingEventHandler {
  constructor(
    private readonly createInvoice: CreateInvoice,
    private readonly getInvoice: GetInvoiceByWorkOrderId,
    private readonly updateInvoiceStatus: UpdateInvoiceStatus,
    private readonly processRefund: ProcessRefund,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const existing = await dynamodb.send(
      new GetCommand({
        TableName: PROCESSED_EVENTS_TABLE,
        Key: { messageId: event.eventId },
      }),
    );
    if (existing.Item) {
      logger.info(
        { eventId: event.eventId, eventType: event.eventType },
        "Duplicate event, skipping",
      );
      return;
    }

    switch (event.eventType) {
      case "WorkOrderApproved":
        await this.handleWorkOrderApproved(
          event as DomainEvent<WorkOrderEventData>,
        );
        break;
      case "WorkOrderCanceled":
        await this.handleWorkOrderCanceled(
          event as DomainEvent<WorkOrderEventData>,
        );
        break;
      default:
        logger.info(
          { eventType: event.eventType },
          "Ignoring unhandled event type",
        );
        return;
    }

    await dynamodb.send(
      new PutCommand({
        TableName: PROCESSED_EVENTS_TABLE,
        Item: {
          messageId: event.eventId,
          processedAt: new Date().toISOString(),
        },
      }),
    );
  }

  private async handleWorkOrderApproved(
    event: DomainEvent<WorkOrderEventData>,
  ): Promise<void> {
    const { workOrderId, customerId, budget, services, parts } = event.data;
    logger.info({ workOrderId }, "WorkOrderApproved — creating invoice");

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

  private async handleWorkOrderCanceled(
    event: DomainEvent<WorkOrderEventData>,
  ): Promise<void> {
    const { workOrderId } = event.data;
    logger.info({ workOrderId }, "WorkOrderCanceled — canceling invoice");

    const invoice = await this.getInvoice.getByWorkOrderId({ workOrderId });
    if (!invoice) {
      logger.info({ workOrderId }, "No invoice found, skipping cancellation");
      return;
    }

    if (invoice.status === "PAID") {
      await this.processRefund.refund({
        workOrderId,
        reason: "Work order canceled",
      });
    }

    await this.updateInvoiceStatus.updateStatus({
      workOrderId,
      invoiceId: invoice.invoiceId,
      status: "CANCELED",
    });
  }
}
