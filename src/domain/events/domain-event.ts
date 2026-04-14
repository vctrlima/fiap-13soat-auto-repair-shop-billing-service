export type EventType =
  | 'WorkOrderCreated'
  | 'WorkOrderUpdated'
  | 'BudgetReady'
  | 'WorkOrderApproved'
  | 'WorkOrderCanceled'
  | 'WorkOrderCompleted'
  | 'PaymentCompleted'
  | 'PaymentFailed'
  | 'RefundRequested'
  | 'RefundCompleted'
  | 'ExecutionCompleted'
  | 'ExecutionFailed';

export interface DomainEvent<T = any> {
  eventType: EventType;
  eventId: string;
  timestamp: string;
  version: string;
  source: string;
  data: T;
}

export interface WorkOrderEventData {
  workOrderId: string;
  customerId: string;
  vehicleId: string;
  status: string;
  budget?: number;
  customerEmail?: string;
  services?: Array<{ id: string; name: string; price: number; quantity: number }>;
  parts?: Array<{ id: string; name: string; price: number; quantity: number }>;
}

export interface PaymentEventData {
  workOrderId: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  status: string;
  failureReason?: string;
}

export interface ExecutionEventData {
  workOrderId: string;
  executionId?: string;
  status: string;
  failureReason?: string;
  completedServices?: string[];
}
