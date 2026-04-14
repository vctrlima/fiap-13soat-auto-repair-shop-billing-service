import { ServerError, UnauthorizedError } from '@/presentation/errors';
import { HttpResponse } from '@/presentation/protocols';

export const badRequest = (error: any): HttpResponse => ({
  statusCode: 400,
  body: error,
});

export const forbidden = (error: any): HttpResponse => ({
  statusCode: 403,
  body: error,
});

export const unauthorized = (): HttpResponse => ({
  statusCode: 401,
  body: new UnauthorizedError(),
});

export const serverError = (error: any): HttpResponse => {
  console.error(new ServerError(error.stack));
  return { statusCode: 500, body: { error: 'Internal server error' } };
};

export const notFound = (error: any): HttpResponse => {
  console.error(error);
  return { statusCode: 404, body: { error: 'Resource not found' } };
};

export const ok = (data: any): HttpResponse => ({
  statusCode: 200,
  body: data,
});

export const created = (data: any): HttpResponse => ({
  statusCode: 201,
  body: data,
});

export const noContent = (): HttpResponse => ({
  statusCode: 204,
  body: null,
});
