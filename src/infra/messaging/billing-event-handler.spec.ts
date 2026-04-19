jest.mock("@/infra/observability", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

const mockDynamoSend = jest.fn().mockResolvedValue({ Item: undefined });
jest.mock("@/infra/db/dynamodb-client", () => ({
  dynamodb: { send: (...args: any[]) => mockDynamoSend(...args) },
}));

import type { EventType } from "@/domain/events/domain-event";
import {
  CreateInvoice,
  GetInvoiceByWorkOrderId,
  ProcessRefund,
  UpdateInvoiceStatus,
} from "@/domain/use-cases";
import { BillingEventHandler } from "@/infra/messaging/billing-event-handler";

const makeCreateInvoice = (): CreateInvoice => ({ create: jest.fn() });
const makeGetInvoice = (): GetInvoiceByWorkOrderId => ({
  getByWorkOrderId: jest.fn(),
});
const makeUpdateStatus = (): UpdateInvoiceStatus => ({
  updateStatus: jest.fn(),
});
const makeProcessRefund = (): ProcessRefund => ({ refund: jest.fn() });

const makeSut = () => {
  const createInvoice = makeCreateInvoice();
  const getInvoice = makeGetInvoice();
  const updateStatus = makeUpdateStatus();
  const processRefund = makeProcessRefund();
  const sut = new BillingEventHandler(
    createInvoice,
    getInvoice,
    updateStatus,
    processRefund,
  );
  return { sut, createInvoice, getInvoice, updateStatus, processRefund };
};

const makeEvent = (eventType: EventType, data: any) => ({
  eventType,
  eventId: "evt-1",
  timestamp: new Date().toISOString(),
  version: "1.0",
  source: "test",
  data,
});

describe("BillingEventHandler", () => {
  describe("WorkOrderApproved", () => {
    it("should create invoice from work order data", async () => {
      const { sut, createInvoice } = makeSut();
      const event = makeEvent("WorkOrderApproved", {
        workOrderId: "wo-1",
        customerId: "c-1",
        budget: 150,
        services: [
          {
            id: "s-1",
            name: "Oil Change",
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
          },
        ],
        parts: [
          {
            id: "p-1",
            name: "Oil Filter",
            quantity: 2,
            unitPrice: 25,
            totalPrice: 50,
          },
        ],
      });
      await sut.handle(event);
      expect(createInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workOrderId: "wo-1",
          customerId: "c-1",
        }),
      );
    });
  });

  describe("WorkOrderCanceled", () => {
    it("should refund if invoice is PAID and cancel invoice", async () => {
      const { sut, getInvoice, processRefund, updateStatus } = makeSut();
      (getInvoice.getByWorkOrderId as jest.Mock).mockResolvedValue({
        workOrderId: "wo-1",
        invoiceId: "inv-1",
        status: "PAID",
      });
      await sut.handle(makeEvent("WorkOrderCanceled", { workOrderId: "wo-1" }));
      expect(processRefund.refund).toHaveBeenCalled();
      expect(updateStatus.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: "CANCELED" }),
      );
    });

    it("should not refund if invoice is not PAID", async () => {
      const { sut, getInvoice, processRefund, updateStatus } = makeSut();
      (getInvoice.getByWorkOrderId as jest.Mock).mockResolvedValue({
        workOrderId: "wo-1",
        invoiceId: "inv-1",
        status: "PENDING",
      });
      await sut.handle(makeEvent("WorkOrderCanceled", { workOrderId: "wo-1" }));
      expect(processRefund.refund).not.toHaveBeenCalled();
      expect(updateStatus.updateStatus).toHaveBeenCalled();
    });

    it("should skip when no invoice found for work order", async () => {
      const { sut, getInvoice, processRefund, updateStatus } = makeSut();
      (getInvoice.getByWorkOrderId as jest.Mock).mockResolvedValue(null);
      await sut.handle(makeEvent("WorkOrderCanceled", { workOrderId: "wo-1" }));
      expect(processRefund.refund).not.toHaveBeenCalled();
      expect(updateStatus.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("Unknown event", () => {
    it("should log for unhandled events", async () => {
      const { sut } = makeSut();
      await sut.handle(makeEvent("UnknownEvent" as EventType, {}));
      const { logger } = jest.requireMock("@/infra/observability");
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "UnknownEvent" }),
        expect.any(String),
      );
    });
  });
});
