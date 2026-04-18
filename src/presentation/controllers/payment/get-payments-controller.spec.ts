import { GetPaymentsController } from '@/presentation/controllers/get-payments-controller';
import { GetPaymentByWorkOrderId } from '@/domain/use-cases';

const makeGetPayments = (): GetPaymentByWorkOrderId => ({ getByWorkOrderId: jest.fn() });
const makeSut = () => {
  const getPayments = makeGetPayments();
  const sut = new GetPaymentsController(getPayments);
  return { sut, getPayments };
};

describe('GetPaymentsController', () => {
  it('should return 400 if no workOrderId', async () => {
    const { sut } = makeSut();
    const result = await sut.handle({ params: {} } as any);
    expect(result.statusCode).toBe(400);
  });

  it('should return 200 with payments', async () => {
    const { sut, getPayments } = makeSut();
    const mockPayments = [{ workOrderId: 'wo-1', paymentId: 'pay-1', status: 'COMPLETED' }];
    (getPayments.getByWorkOrderId as jest.Mock).mockResolvedValue(mockPayments);
    const result = await sut.handle({ params: { workOrderId: 'wo-1' } });
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(mockPayments);
  });

  it('should return 500 on error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { sut, getPayments } = makeSut();
    (getPayments.getByWorkOrderId as jest.Mock).mockRejectedValue(new Error('err'));
    const result = await sut.handle({ params: { workOrderId: 'wo-1' } });
    expect(result.statusCode).toBe(500);
    consoleSpy.mockRestore();
  });
});
