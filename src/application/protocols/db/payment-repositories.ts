import { ProcessPayment, GetPaymentByWorkOrderId, ProcessRefund } from '@/domain/use-cases';

export interface ProcessPaymentRepository {
  process(params: ProcessPaymentRepository.Params): Promise<ProcessPaymentRepository.Result>;
}
export namespace ProcessPaymentRepository {
  export type Params = ProcessPayment.Params;
  export type Result = ProcessPayment.Result;
}

export interface GetPaymentByWorkOrderIdRepository {
  getByWorkOrderId(params: GetPaymentByWorkOrderIdRepository.Params): Promise<GetPaymentByWorkOrderIdRepository.Result>;
}
export namespace GetPaymentByWorkOrderIdRepository {
  export type Params = GetPaymentByWorkOrderId.Params;
  export type Result = GetPaymentByWorkOrderId.Result;
}

export interface ProcessRefundRepository {
  refund(params: ProcessRefundRepository.Params): Promise<ProcessRefundRepository.Result>;
}
export namespace ProcessRefundRepository {
  export type Params = ProcessRefund.Params;
  export type Result = ProcessRefund.Result;
}
