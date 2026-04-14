export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_TRANSFER';

export interface Payment {
  workOrderId: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}
