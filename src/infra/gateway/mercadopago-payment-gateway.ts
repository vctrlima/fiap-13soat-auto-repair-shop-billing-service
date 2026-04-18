import { PaymentGateway } from "@/application/protocols/gateway";
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";

const PAYMENT_METHOD_MAP: Record<string, string> = {
  PIX: "pix",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  BANK_TRANSFER: "bank_transfer",
};

export class MercadoPagoPaymentGateway implements PaymentGateway {
  private readonly paymentClient: Payment;
  private readonly refundClient: PaymentRefund;

  constructor(accessToken: string) {
    const config = new MercadoPagoConfig({ accessToken });
    this.paymentClient = new Payment(config);
    this.refundClient = new PaymentRefund(config);
  }

  async createPayment(
    params: PaymentGateway.CreateParams,
  ): Promise<PaymentGateway.CreateResult> {
    const response = await this.paymentClient.create({
      body: {
        transaction_amount: params.amount,
        description: params.description,
        payment_method_id: PAYMENT_METHOD_MAP[params.method] ?? "pix",
        external_reference: params.externalReference,
        payer: { email: params.payerEmail ?? "customer@autorepairshop.com" },
      },
    });

    const statusMap: Record<string, "approved" | "rejected" | "pending"> = {
      approved: "approved",
      rejected: "rejected",
      in_process: "pending",
      pending: "pending",
    };

    return {
      gatewayPaymentId: String(response.id),
      status: statusMap[response.status ?? ""] ?? "pending",
      gatewayStatus: response.status ?? "unknown",
    };
  }

  async refundPayment(
    params: PaymentGateway.RefundParams,
  ): Promise<PaymentGateway.RefundResult> {
    const response = await this.refundClient.create({
      payment_id: Number(params.gatewayPaymentId),
      body: params.amount ? { amount: params.amount } : {},
    });

    return {
      gatewayRefundId: String(response.id),
      status: response.status === "approved" ? "approved" : "rejected",
    };
  }
}
