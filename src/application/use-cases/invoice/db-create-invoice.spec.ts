jest.mock('@/infra/observability', () => ({
  invoiceCreatedCounter: { add: jest.fn() },
}));

import { DbCreateInvoice } from '@/application/use-cases/db-create-invoice';
import { CreateInvoiceRepository } from '@/application/protocols/db';

const makeRepository = (): CreateInvoiceRepository => ({ create: jest.fn() });
const makeSut = () => {
  const repository = makeRepository();
  const sut = new DbCreateInvoice(repository);
  return { sut, repository };
};

describe('DbCreateInvoice', () => {
  const params = { workOrderId: 'wo-1', customerId: 'c-1', amount: 100, services: [], parts: [] };
  const mockResult = { ...params, invoiceId: 'inv-1', status: 'PENDING', createdAt: new Date().toISOString() };

  it('should call repository with correct params', async () => {
    const { sut, repository } = makeSut();
    (repository.create as jest.Mock).mockResolvedValue(mockResult);
    await sut.create(params);
    expect(repository.create).toHaveBeenCalledWith(params);
  });

  it('should increment counter on success', async () => {
    const { sut, repository } = makeSut();
    const { invoiceCreatedCounter } = require('@/infra/observability');
    (repository.create as jest.Mock).mockResolvedValue(mockResult);
    await sut.create(params);
    expect(invoiceCreatedCounter.add).toHaveBeenCalledWith(1);
  });

  it('should return created invoice', async () => {
    const { sut, repository } = makeSut();
    (repository.create as jest.Mock).mockResolvedValue(mockResult);
    const result = await sut.create(params);
    expect(result).toEqual(mockResult);
  });

  it('should throw if repository throws', async () => {
    const { sut, repository } = makeSut();
    (repository.create as jest.Mock).mockRejectedValue(new Error('err'));
    await expect(sut.create(params)).rejects.toThrow('err');
  });
});
