import { GetInvoiceByWorkOrderIdRepository } from '@/application/protocols/db';
import { GetInvoiceByWorkOrderId } from '@/domain/use-cases';

export class DbGetInvoiceByWorkOrderId implements GetInvoiceByWorkOrderId {
  constructor(private readonly getInvoiceByWorkOrderIdRepository: GetInvoiceByWorkOrderIdRepository) {}

  async getByWorkOrderId(params: GetInvoiceByWorkOrderId.Params): Promise<GetInvoiceByWorkOrderId.Result> {
    return await this.getInvoiceByWorkOrderIdRepository.getByWorkOrderId(params);
  }
}
