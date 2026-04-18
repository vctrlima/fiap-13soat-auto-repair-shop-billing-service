import { DbGetInvoiceByWorkOrderId } from '@/application/use-cases/db-get-invoice-by-work-order-id';
import { GetInvoiceByWorkOrderIdRepository } from '@/application/protocols/db';

const makeRepository = (): GetInvoiceByWorkOrderIdRepository => ({ getByWorkOrderId: jest.fn() });
const makeSut = () => {
  const repository = makeRepository();
  const sut = new DbGetInvoiceByWorkOrderId(repository);
  return { sut, repository };
};

describe('DbGetInvoiceByWorkOrderId', () => {
  const mockResult = { workOrderId: 'wo-1', invoiceId: 'inv-1', status: 'PENDING', amount: 100 };

  it('should call repository with correct params', async () => {
    const { sut, repository } = makeSut();
    (repository.getByWorkOrderId as jest.Mock).mockResolvedValue(mockResult);
    await sut.getByWorkOrderId({ workOrderId: 'wo-1' });
    expect(repository.getByWorkOrderId).toHaveBeenCalledWith({ workOrderId: 'wo-1' });
  });

  it('should return invoice', async () => {
    const { sut, repository } = makeSut();
    (repository.getByWorkOrderId as jest.Mock).mockResolvedValue(mockResult);
    const result = await sut.getByWorkOrderId({ workOrderId: 'wo-1' });
    expect(result).toEqual(mockResult);
  });

  it('should throw if repository throws', async () => {
    const { sut, repository } = makeSut();
    (repository.getByWorkOrderId as jest.Mock).mockRejectedValue(new Error('not found'));
    await expect(sut.getByWorkOrderId({ workOrderId: 'wo-1' })).rejects.toThrow('not found');
  });
});
