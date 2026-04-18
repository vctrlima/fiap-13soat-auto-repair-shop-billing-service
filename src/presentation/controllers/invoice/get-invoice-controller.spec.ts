import { GetInvoiceController } from '@/presentation/controllers/get-invoice-controller';
import { NotFoundError } from '@/presentation/errors';
import { GetInvoiceByWorkOrderId } from '@/domain/use-cases';

const makeGetInvoice = (): GetInvoiceByWorkOrderId => ({ getByWorkOrderId: jest.fn() });
const makeSut = () => {
  const getInvoice = makeGetInvoice();
  const sut = new GetInvoiceController(getInvoice);
  return { sut, getInvoice };
};

describe('GetInvoiceController', () => {
  it('should return 400 if no workOrderId', async () => {
    const { sut } = makeSut();
    const result = await sut.handle({ params: {} } as any);
    expect(result.statusCode).toBe(400);
  });

  it('should return 200 with invoice', async () => {
    const { sut, getInvoice } = makeSut();
    const mockInvoice = { workOrderId: 'wo-1', invoiceId: 'inv-1', status: 'PENDING' };
    (getInvoice.getByWorkOrderId as jest.Mock).mockResolvedValue(mockInvoice);
    const result = await sut.handle({ params: { workOrderId: 'wo-1' } });
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(mockInvoice);
  });

  it('should return 404 if not found', async () => {
    const { sut, getInvoice } = makeSut();
    (getInvoice.getByWorkOrderId as jest.Mock).mockRejectedValue(new NotFoundError('Invoice'));
    const result = await sut.handle({ params: { workOrderId: 'wo-1' } });
    expect(result.statusCode).toBe(404);
  });

  it('should return 500 on error', async () => {
    const { sut, getInvoice } = makeSut();
    (getInvoice.getByWorkOrderId as jest.Mock).mockRejectedValue(new Error('err'));
    const result = await sut.handle({ params: { workOrderId: 'wo-1' } });
    expect(result.statusCode).toBe(500);
  });
});
