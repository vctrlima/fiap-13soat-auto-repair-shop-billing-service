export type InvoiceStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELED';

export interface Invoice {
  workOrderId: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  status: InvoiceStatus;
  services: InvoiceLineItem[];
  parts: InvoiceLineItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
