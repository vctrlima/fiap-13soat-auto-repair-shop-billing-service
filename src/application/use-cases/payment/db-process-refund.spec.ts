jest.mock('@/infra/observability', () => ({
  refundProcessedCounter: { add: jest.fn() },
}));

import { DbProcessRefund } from '@/application/use-cases/db-process-refund';
import { ProcessRefundRepository } from '@/application/protocols/db';
import { EventPublisher } from '@/application/protocols/messaging';

const makeRepository = (): ProcessRefundRepository => ({ refund: jest.fn() });
const makePublisher = (): EventPublisher => ({ publish: jest.fn() });
const makeSut = () => {
  const repository = makeRepository();
  const publisher = makePublisher();
  const sut = new DbProcessRefund(repository, publisher);
  return { sut, repository, publisher };
};

describe('DbProcessRefund', () => {
  const params = { workOrderId: 'wo-1', reason: 'Customer request' };
  const mockResult = { workOrderId: 'wo-1', paymentId: 'pay-1', status: 'REFUNDED' };

  it('should call repository and publish RefundCompleted', async () => {
    const { sut, repository, publisher } = makeSut();
    const { refundProcessedCounter } = require('@/infra/observability');
    (repository.refund as jest.Mock).mockResolvedValue(mockResult);
    await sut.refund(params);
    expect(repository.refund).toHaveBeenCalledWith(params);
    expect(publisher.publish).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'RefundCompleted' }));
    expect(refundProcessedCounter.add).toHaveBeenCalledWith(1);
  });

  it('should throw if repository throws', async () => {
    const { sut, repository } = makeSut();
    (repository.refund as jest.Mock).mockRejectedValue(new Error('err'));
    await expect(sut.refund(params)).rejects.toThrow('err');
  });
});
