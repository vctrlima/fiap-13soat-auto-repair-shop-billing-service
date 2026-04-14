import { UpdateInvoiceStatusRepository } from '@/application/protocols/db';
import { UpdateInvoiceStatus } from '@/domain/use-cases';

export class DbUpdateInvoiceStatus implements UpdateInvoiceStatus {
  constructor(private readonly updateInvoiceStatusRepository: UpdateInvoiceStatusRepository) {}

  async updateStatus(params: UpdateInvoiceStatus.Params): Promise<UpdateInvoiceStatus.Result> {
    return await this.updateInvoiceStatusRepository.updateStatus(params);
  }
}
