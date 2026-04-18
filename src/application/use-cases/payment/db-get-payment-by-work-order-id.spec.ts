import { DbGetPaymentByWorkOrderId } from '@/application/use-cases/db-get-payment-by-work-order-id';
import { GetPaymentByWorkOrderIdRepository } from '@/application/protocols/db';

const makeRepository = (): GetPaymentByWorkOrderIdRepository => ({ getByWorkOrderId: jest.fn() });
const makeSut = () => {
  const repository = makeRepository();
  const sut = new DbGetPaymentByWorkOrderId(repository);
  return { sut, repository };
};

describe('DbGetPaymentByWorkOrderId', () => {
  const mockResult = [{ workOrderId: 'wo-1', paymentId: 'pay-1', status: 'COMPLETED' }];

  it('should call repository with correct params', async () => {
    const { sut, repository } = makeSut();
    (repository.getByWorkOrderId as jest.Mock).mockResolvedValue(mockResult);
    await sut.getByWorkOrderId({ workOrderId: 'wo-1' });
    expect(repository.getByWorkOrderId).toHaveBeenCalledWith({ workOrderId: 'wo-1' });
  });

  it('should return payments', async () => {
    const { sut, repository } = makeSut();
    (repository.getByWorkOrderId as jest.Mock).mockResolvedValue(mockResult);
    const result = await sut.getByWorkOrderId({ workOrderId: 'wo-1' });
    expect(result).toEqual(mockResult);
  });

  it('should throw if repository throws', async () => {
    const { sut, repository } = makeSut();
    (repository.getByWorkOrderId as jest.Mock).mockRejectedValue(new Error('err'));
    await expect(sut.getByWorkOrderId({ workOrderId: 'wo-1' })).rejects.toThrow('err');
  });
});
