export const invoiceResponseSchema = {
  type: 'object',
  properties: {
    workOrderId: { type: 'string', format: 'uuid' },
    invoiceId: { type: 'string', format: 'uuid' },
    customerId: { type: 'string', format: 'uuid' },
    amount: { type: 'number' },
    status: { type: 'string', enum: ['PENDING', 'PAID', 'REFUNDED', 'CANCELED'] },
    services: { type: 'array', items: { type: 'object' } },
    parts: { type: 'array', items: { type: 'object' } },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

export const paymentResponseSchema = {
  type: 'object',
  properties: {
    workOrderId: { type: 'string', format: 'uuid' },
    paymentId: { type: 'string', format: 'uuid' },
    invoiceId: { type: 'string', format: 'uuid' },
    amount: { type: 'number' },
    method: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER'] },
    status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
    failureReason: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

export const errorResponseSchema = {
  type: 'object',
  properties: { error: { type: 'string' } },
};
