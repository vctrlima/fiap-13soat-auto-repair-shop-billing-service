import { Payment, PaymentMethod } from '@/domain/entities';

export interface ProcessPayment {
  process(params: ProcessPayment.Params): Promise<ProcessPayment.Result>;
}

export namespace ProcessPayment {
  export type Params = {
    workOrderId: string;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
  };
  export type Result = Payment;
}

export interface GetPaymentByWorkOrderId {
  getByWorkOrderId(params: GetPaymentByWorkOrderId.Params): Promise<GetPaymentByWorkOrderId.Result>;
}

export namespace GetPaymentByWorkOrderId {
  export type Params = { workOrderId: string };
  export type Result = Payment[];
}

export interface ProcessRefund {
  refund(params: ProcessRefund.Params): Promise<ProcessRefund.Result>;
}

export namespace ProcessRefund {
  export type Params = { workOrderId: string; reason?: string };
  export type Result = Payment;
}
