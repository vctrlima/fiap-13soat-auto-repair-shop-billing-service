jest.mock("@/infra/observability", () => ({
  dbQueryDuration: { record: jest.fn() },
  dbQueryErrorCounter: { add: jest.fn() },
}));

jest.mock("@/infra/db/dynamodb-client", () => ({
  dynamodb: { send: jest.fn() },
}));

import { dynamodb } from "@/infra/db/dynamodb-client";
import { DynamoPaymentRepository } from "@/infra/db/repositories/dynamo-payment-repository";

const mockSend = dynamodb.send as jest.Mock;

describe("DynamoPaymentRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  const sut = new DynamoPaymentRepository();

  describe("process", () => {
    it("should create payment", async () => {
      mockSend.mockResolvedValue({});
      const result = await sut.process({
        workOrderId: "wo-1",
        invoiceId: "inv-1",
        amount: 100,
        method: "PIX",
      } as any);
      expect(result.workOrderId).toBe("wo-1");
      expect(result.status).toBe("COMPLETED");
      expect(result.paymentId).toBeDefined();
    });

    it("should handle errors", async () => {
      mockSend.mockRejectedValue(new Error("db error"));
      await expect(
        sut.process({
          workOrderId: "wo-1",
          invoiceId: "inv-1",
          amount: 100,
          method: "PIX",
        } as any),
      ).rejects.toThrow("db error");
    });
  });

  describe("getByWorkOrderId", () => {
    it("should return payments", async () => {
      const payments = [
        { workOrderId: "wo-1", paymentId: "pay-1", status: "COMPLETED" },
      ];
      mockSend.mockResolvedValue({ Items: payments });
      const result = await sut.getByWorkOrderId({ workOrderId: "wo-1" });
      expect(result).toEqual(payments);
    });

    it("should return empty array if no items", async () => {
      mockSend.mockResolvedValue({});
      const result = await sut.getByWorkOrderId({ workOrderId: "wo-1" });
      expect(result).toEqual([]);
    });

    it("should handle errors", async () => {
      mockSend.mockRejectedValue(new Error("db error"));
      await expect(
        sut.getByWorkOrderId({ workOrderId: "wo-1" }),
      ).rejects.toThrow("db error");
    });
  });

  describe("refund", () => {
    it("should refund completed payment", async () => {
      const payments = [
        { workOrderId: "wo-1", paymentId: "pay-1", status: "COMPLETED" },
      ];
      mockSend
        .mockResolvedValueOnce({ Items: payments }) // getByWorkOrderId
        .mockResolvedValueOnce({
          Attributes: { ...payments[0], status: "REFUNDED" },
        }); // update
      const result = await sut.refund({ workOrderId: "wo-1" } as any);
      expect(result.status).toBe("REFUNDED");
    });

    it("should throw if no completed payment found", async () => {
      const payments = [
        { workOrderId: "wo-1", paymentId: "pay-1", status: "REFUNDED" },
      ];
      mockSend.mockResolvedValueOnce({ Items: payments });
      await expect(sut.refund({ workOrderId: "wo-1" } as any)).rejects.toThrow(
        "No completed payment found",
      );
    });

    it("should handle update errors", async () => {
      const payments = [
        { workOrderId: "wo-1", paymentId: "pay-1", status: "COMPLETED" },
      ];
      mockSend
        .mockResolvedValueOnce({ Items: payments })
        .mockRejectedValueOnce(new Error("db error"));
      await expect(sut.refund({ workOrderId: "wo-1" } as any)).rejects.toThrow(
        "db error",
      );
    });
  });
});
