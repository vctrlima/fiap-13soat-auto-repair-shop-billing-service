import { GetPaymentByWorkOrderIdRepository } from '@/application/protocols/db';
import { GetPaymentByWorkOrderId } from '@/domain/use-cases';

export class DbGetPaymentByWorkOrderId implements GetPaymentByWorkOrderId {
  constructor(private readonly getPaymentByWorkOrderIdRepository: GetPaymentByWorkOrderIdRepository) {}

  async getByWorkOrderId(params: GetPaymentByWorkOrderId.Params): Promise<GetPaymentByWorkOrderId.Result> {
    return await this.getPaymentByWorkOrderIdRepository.getByWorkOrderId(params);
  }
}
