export class NotFoundError extends Error {
  constructor(stack: string) {
    super('Not found error');
    this.name = 'NotFoundError';
    this.stack = stack;
  }
}
