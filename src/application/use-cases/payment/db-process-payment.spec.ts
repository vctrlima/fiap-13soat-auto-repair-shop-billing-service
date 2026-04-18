jest.mock("@/infra/observability", () => ({
  paymentProcessedCounter: { add: jest.fn() },
  paymentFailedCounter: { add: jest.fn() },
}));

import { ProcessPaymentRepository } from "@/application/protocols/db";
import { PaymentGateway } from "@/application/protocols/gateway";
import { EventPublisher } from "@/application/protocols/messaging";
import { DbProcessPayment } from "@/application/use-cases/db-process-payment";

const makeRepository = (): ProcessPaymentRepository => ({ process: jest.fn() });
const makePublisher = (): EventPublisher => ({ publish: jest.fn() });
const makeGateway = (): PaymentGateway => ({
  createPayment: jest.fn(),
  refundPayment: jest.fn(),
});
const makeSut = (gateway?: PaymentGateway) => {
  const repository = makeRepository();
  const publisher = makePublisher();
  const sut = new DbProcessPayment(repository, publisher, gateway);
  return { sut, repository, publisher };
};

describe("DbProcessPayment", () => {
  const params = {
    workOrderId: "wo-1",
    invoiceId: "inv-1",
    amount: 100,
    method: "PIX" as any,
  };

  beforeEach(() => jest.clearAllMocks());

  it("should publish PaymentCompleted on success", async () => {
    const { sut, repository, publisher } = makeSut();
    const { paymentProcessedCounter } = require("@/infra/observability");
    const mockPayment = { ...params, paymentId: "pay-1", status: "COMPLETED" };
    (repository.process as jest.Mock).mockResolvedValue(mockPayment);
    await sut.process(params);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PaymentCompleted" }),
    );
    expect(paymentProcessedCounter.add).toHaveBeenCalledWith(1);
  });

  it("should publish PaymentFailed on failure", async () => {
    const { sut, repository, publisher } = makeSut();
    const { paymentFailedCounter } = require("@/infra/observability");
    const mockPayment = {
      ...params,
      paymentId: "pay-1",
      status: "FAILED",
      failureReason: "Insufficient funds",
    };
    (repository.process as jest.Mock).mockResolvedValue(mockPayment);
    await sut.process(params);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PaymentFailed" }),
    );
    expect(paymentFailedCounter.add).toHaveBeenCalledWith(1);
  });

  it("should throw if repository throws", async () => {
    const { sut, repository } = makeSut();
    (repository.process as jest.Mock).mockRejectedValue(new Error("err"));
    await expect(sut.process(params)).rejects.toThrow("err");
  });

  describe("with PaymentGateway (Mercado Pago)", () => {
    it("should call gateway before repository when configured", async () => {
      const gateway = makeGateway();
      const { sut, repository } = makeSut(gateway);
      (gateway.createPayment as jest.Mock).mockResolvedValue({
        gatewayPaymentId: "mp-1",
        status: "approved",
        gatewayStatus: "approved",
      });
      (repository.process as jest.Mock).mockResolvedValue({
        ...params,
        paymentId: "pay-1",
        status: "COMPLETED",
      });
      await sut.process(params);
      expect(gateway.createPayment).toHaveBeenCalled();
      expect(repository.process).toHaveBeenCalled();
    });

    it("should publish PaymentFailed when gateway rejects", async () => {
      const gateway = makeGateway();
      const { sut, repository, publisher } = makeSut(gateway);
      (gateway.createPayment as jest.Mock).mockResolvedValue({
        gatewayPaymentId: "mp-1",
        status: "rejected",
        gatewayStatus: "cc_rejected",
      });
      (repository.process as jest.Mock).mockResolvedValue({
        ...params,
        paymentId: "pay-1",
        status: "FAILED",
      });
      await sut.process(params);
      expect(publisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "PaymentFailed" }),
      );
    });

    it("should fall back to internal processing on gateway error", async () => {
      const gateway = makeGateway();
      const { sut, repository } = makeSut(gateway);
      (gateway.createPayment as jest.Mock).mockRejectedValue(
        new Error("Gateway timeout"),
      );
      (repository.process as jest.Mock).mockResolvedValue({
        ...params,
        paymentId: "pay-1",
        status: "COMPLETED",
      });
      const result = await sut.process(params);
      expect(result.status).toBe("COMPLETED");
    });
  });
});
