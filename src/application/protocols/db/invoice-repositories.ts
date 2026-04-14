import { CreateInvoice, GetInvoiceByWorkOrderId, UpdateInvoiceStatus } from '@/domain/use-cases';

export interface CreateInvoiceRepository {
  create(params: CreateInvoiceRepository.Params): Promise<CreateInvoiceRepository.Result>;
}
export namespace CreateInvoiceRepository {
  export type Params = CreateInvoice.Params;
  export type Result = CreateInvoice.Result;
}

export interface GetInvoiceByWorkOrderIdRepository {
  getByWorkOrderId(params: GetInvoiceByWorkOrderIdRepository.Params): Promise<GetInvoiceByWorkOrderIdRepository.Result>;
}
export namespace GetInvoiceByWorkOrderIdRepository {
  export type Params = GetInvoiceByWorkOrderId.Params;
  export type Result = GetInvoiceByWorkOrderId.Result;
}

export interface UpdateInvoiceStatusRepository {
  updateStatus(params: UpdateInvoiceStatusRepository.Params): Promise<UpdateInvoiceStatusRepository.Result>;
}
export namespace UpdateInvoiceStatusRepository {
  export type Params = UpdateInvoiceStatus.Params;
  export type Result = UpdateInvoiceStatus.Result;
}
