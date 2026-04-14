import { Controller, HttpRequest } from '@/presentation/protocols';
import { FastifyReply, FastifyRequest } from 'fastify';

export const buildRoute = (controller: Controller) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const httpRequest: HttpRequest = { ...request };
    const httpResponse = await controller.handle(httpRequest);
    if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
      reply.status(httpResponse.statusCode).send(httpResponse.body);
    } else {
      const error = httpResponse.body.message || 'Internal Server Error';
      reply.status(httpResponse.statusCode).send({ error });
    }
  };
};
