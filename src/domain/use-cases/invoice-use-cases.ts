import { Invoice } from '@/domain/entities';

export interface CreateInvoice {
  create(params: CreateInvoice.Params): Promise<CreateInvoice.Result>;
}

export namespace CreateInvoice {
  export type Params = {
    workOrderId: string;
    customerId: string;
    amount: number;
    services: Array<{ id: string; name: string; quantity: number; unitPrice: number; totalPrice: number }>;
    parts: Array<{ id: string; name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  };
  export type Result = Invoice;
}

export interface GetInvoiceByWorkOrderId {
  getByWorkOrderId(params: GetInvoiceByWorkOrderId.Params): Promise<GetInvoiceByWorkOrderId.Result>;
}

export namespace GetInvoiceByWorkOrderId {
  export type Params = { workOrderId: string };
  export type Result = Invoice;
}

export interface UpdateInvoiceStatus {
  updateStatus(params: UpdateInvoiceStatus.Params): Promise<UpdateInvoiceStatus.Result>;
}

export namespace UpdateInvoiceStatus {
  export type Params = { workOrderId: string; invoiceId: string; status: string };
  export type Result = Invoice;
}
