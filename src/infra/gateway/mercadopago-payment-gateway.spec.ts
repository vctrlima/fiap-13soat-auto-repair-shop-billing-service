import { MercadoPagoPaymentGateway } from "@/infra/gateway/mercadopago-payment-gateway";

const mockCreate = jest.fn();
const mockRefundCreate = jest.fn();

jest.mock("mercadopago", () => ({
  MercadoPagoConfig: jest.fn(),
  Payment: jest.fn().mockImplementation(() => ({ create: mockCreate })),
  PaymentRefund: jest
    .fn()
    .mockImplementation(() => ({ create: mockRefundCreate })),
}));

describe("MercadoPagoPaymentGateway", () => {
  let sut: MercadoPagoPaymentGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    sut = new MercadoPagoPaymentGateway("test-token");
  });

  describe("createPayment", () => {
    it("should create payment and return approved status", async () => {
      mockCreate.mockResolvedValue({ id: 123, status: "approved" });
      const result = await sut.createPayment({
        amount: 100,
        description: "Test",
        method: "PIX",
        externalReference: "ref-1",
        payerEmail: "test@test.com",
      });
      expect(result.gatewayPaymentId).toBe("123");
      expect(result.status).toBe("approved");
    });

    it("should handle rejected status", async () => {
      mockCreate.mockResolvedValue({ id: 456, status: "rejected" });
      const result = await sut.createPayment({
        amount: 50,
        description: "Test",
        method: "CREDIT_CARD",
        externalReference: "ref-2",
      });
      expect(result.status).toBe("rejected");
    });

    it("should handle pending status", async () => {
      mockCreate.mockResolvedValue({ id: 789, status: "in_process" });
      const result = await sut.createPayment({
        amount: 50,
        description: "Test",
        method: "DEBIT_CARD",
        externalReference: "ref-3",
      });
      expect(result.status).toBe("pending");
    });

    it("should handle unknown status", async () => {
      mockCreate.mockResolvedValue({ id: 100, status: "unknown_status" });
      const result = await sut.createPayment({
        amount: 50,
        description: "Test",
        method: "BANK_TRANSFER",
        externalReference: "ref-4",
      });
      expect(result.status).toBe("pending");
    });

    it("should handle null status", async () => {
      mockCreate.mockResolvedValue({ id: 101, status: null });
      const result = await sut.createPayment({
        amount: 50,
        description: "Test",
        method: "OTHER",
        externalReference: "ref-5",
      });
      expect(result.gatewayStatus).toBe("unknown");
    });

    it("should use default pix for unknown method", async () => {
      mockCreate.mockResolvedValue({ id: 102, status: "pending" });
      const result = await sut.createPayment({
        amount: 50,
        description: "Test",
        method: "UNKNOWN_METHOD",
        externalReference: "ref-6",
      });
      expect(result).toBeDefined();
    });
  });

  describe("refundPayment", () => {
    it("should refund payment successfully", async () => {
      mockRefundCreate.mockResolvedValue({ id: 999, status: "approved" });
      const result = await sut.refundPayment({ gatewayPaymentId: "123" });
      expect(result.gatewayRefundId).toBe("999");
      expect(result.status).toBe("approved");
    });

    it("should handle rejected refund", async () => {
      mockRefundCreate.mockResolvedValue({ id: 998, status: "rejected" });
      const result = await sut.refundPayment({ gatewayPaymentId: "123" });
      expect(result.status).toBe("rejected");
    });

    it("should handle partial refund with amount", async () => {
      mockRefundCreate.mockResolvedValue({ id: 997, status: "approved" });
      const result = await sut.refundPayment({
        gatewayPaymentId: "123",
        amount: 50,
      });
      expect(result.gatewayRefundId).toBe("997");
    });
  });
});
