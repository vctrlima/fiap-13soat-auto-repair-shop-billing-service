import { DbUpdateInvoiceStatus } from '@/application/use-cases/db-update-invoice-status';
import { UpdateInvoiceStatusRepository } from '@/application/protocols/db';

const makeRepository = (): UpdateInvoiceStatusRepository => ({ updateStatus: jest.fn() });
const makeSut = () => {
  const repository = makeRepository();
  const sut = new DbUpdateInvoiceStatus(repository);
  return { sut, repository };
};

describe('DbUpdateInvoiceStatus', () => {
  const params = { workOrderId: 'wo-1', invoiceId: 'inv-1', status: 'PAID' };
  const mockResult = { workOrderId: 'wo-1', invoiceId: 'inv-1', status: 'PAID', amount: 100 };

  it('should call repository with correct params', async () => {
    const { sut, repository } = makeSut();
    (repository.updateStatus as jest.Mock).mockResolvedValue(mockResult);
    await sut.updateStatus(params);
    expect(repository.updateStatus).toHaveBeenCalledWith(params);
  });

  it('should return updated invoice', async () => {
    const { sut, repository } = makeSut();
    (repository.updateStatus as jest.Mock).mockResolvedValue(mockResult);
    const result = await sut.updateStatus(params);
    expect(result).toEqual(mockResult);
  });

  it('should throw if repository throws', async () => {
    const { sut, repository } = makeSut();
    (repository.updateStatus as jest.Mock).mockRejectedValue(new Error('err'));
    await expect(sut.updateStatus(params)).rejects.toThrow('err');
  });
});
