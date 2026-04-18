jest.mock("@/infra/observability", () => ({
  dbQueryDuration: { record: jest.fn() },
  dbQueryErrorCounter: { add: jest.fn() },
}));

jest.mock("@/infra/db/dynamodb-client", () => ({
  dynamodb: { send: jest.fn() },
}));

import { dynamodb } from "@/infra/db/dynamodb-client";
import { DynamoInvoiceRepository } from "@/infra/db/repositories/dynamo-invoice-repository";

const mockSend = dynamodb.send as jest.Mock;

describe("DynamoInvoiceRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  const sut = new DynamoInvoiceRepository();

  describe("create", () => {
    it("should create invoice", async () => {
      mockSend.mockResolvedValue({});
      const result = await sut.create({
        workOrderId: "wo-1",
        customerId: "c-1",
        amount: 100,
        services: [
          {
            id: "s-1",
            name: "Brake",
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
        parts: [],
      } as any);
      expect(result.workOrderId).toBe("wo-1");
      expect(result.status).toBe("PENDING");
      expect(result.invoiceId).toBeDefined();
      expect(mockSend).toHaveBeenCalled();
    });

    it("should handle errors", async () => {
      mockSend.mockRejectedValue(new Error("db error"));
      await expect(
        sut.create({
          workOrderId: "wo-1",
          customerId: "c-1",
          amount: 100,
          services: [],
          parts: [],
        } as any),
      ).rejects.toThrow("db error");
    });
  });

  describe("getByWorkOrderId", () => {
    it("should return invoice", async () => {
      const invoice = {
        workOrderId: "wo-1",
        invoiceId: "inv-1",
        status: "PENDING",
      };
      mockSend.mockResolvedValue({ Items: [invoice] });
      const result = await sut.getByWorkOrderId({ workOrderId: "wo-1" });
      expect(result).toEqual(invoice);
    });

    it("should return null if no items", async () => {
      mockSend.mockResolvedValue({ Items: [] });
      const result = await sut.getByWorkOrderId({ workOrderId: "wo-1" });
      expect(result).toBeNull();
    });

    it("should return null if Items is undefined", async () => {
      mockSend.mockResolvedValue({});
      const result = await sut.getByWorkOrderId({ workOrderId: "wo-1" });
      expect(result).toBeNull();
    });

    it("should handle errors", async () => {
      mockSend.mockRejectedValue(new Error("db error"));
      await expect(
        sut.getByWorkOrderId({ workOrderId: "wo-1" }),
      ).rejects.toThrow("db error");
    });
  });

  describe("updateStatus", () => {
    it("should update invoice status", async () => {
      const updated = {
        workOrderId: "wo-1",
        invoiceId: "inv-1",
        status: "PAID",
      };
      mockSend.mockResolvedValue({ Attributes: updated });
      const result = await sut.updateStatus({
        workOrderId: "wo-1",
        invoiceId: "inv-1",
        status: "PAID",
      });
      expect(result).toEqual(updated);
    });

    it("should handle errors", async () => {
      mockSend.mockRejectedValue(new Error("db error"));
      await expect(
        sut.updateStatus({
          workOrderId: "wo-1",
          invoiceId: "inv-1",
          status: "PAID",
        }),
      ).rejects.toThrow("db error");
    });
  });
});
