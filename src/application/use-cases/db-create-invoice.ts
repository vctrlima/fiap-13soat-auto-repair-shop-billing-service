import { CreateInvoiceRepository } from '@/application/protocols/db';
import { CreateInvoice } from '@/domain/use-cases';
import { invoiceCreatedCounter } from '@/infra/observability';

export class DbCreateInvoice implements CreateInvoice {
  constructor(private readonly createInvoiceRepository: CreateInvoiceRepository) {}

  async create(params: CreateInvoice.Params): Promise<CreateInvoice.Result> {
    const invoice = await this.createInvoiceRepository.create(params);
    invoiceCreatedCounter.add(1);
    return invoice;
  }
}
