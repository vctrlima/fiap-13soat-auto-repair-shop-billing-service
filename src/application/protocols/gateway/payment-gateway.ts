import { PaymentMethod } from "@/domain/entities";

export interface PaymentGateway {
  createPayment(
    params: PaymentGateway.CreateParams,
  ): Promise<PaymentGateway.CreateResult>;
  refundPayment(
    params: PaymentGateway.RefundParams,
  ): Promise<PaymentGateway.RefundResult>;
}

export namespace PaymentGateway {
  export type CreateParams = {
    externalReference: string;
    description: string;
    amount: number;
    method: PaymentMethod;
    payerEmail?: string;
  };
  export type CreateResult = {
    gatewayPaymentId: string;
    status: "approved" | "rejected" | "pending";
    gatewayStatus: string;
  };
  export type RefundParams = {
    gatewayPaymentId: string;
    amount?: number;
  };
  export type RefundResult = {
    gatewayRefundId: string;
    status: "approved" | "rejected";
  };
}
