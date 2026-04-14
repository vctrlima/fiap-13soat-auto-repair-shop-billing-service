import { User } from '@/domain/entities';
import { Middleware } from '@/presentation/protocols';
import { FastifyReply, FastifyRequest } from 'fastify';

export const buildMiddleware = (middleware: Middleware) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accessToken = request.headers?.['authorization'];
      const httpRequest = { accessToken, ...(request.headers || {}) };
      const user = await middleware.handle(httpRequest);
      if (!user) return;
      request.headers = { ...request.headers, userId: user?.id };
      (request as Request).user = user;
    } catch {
      reply.status(401).send({ error: 'Access Denied' });
    }
  };
};

type Request = FastifyRequest & { user: Partial<User> };
