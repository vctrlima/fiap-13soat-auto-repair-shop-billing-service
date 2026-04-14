import { invoiceRoutes, paymentRoutes } from '@/main/routes';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';
import { docs } from './docs';

export type AppOptions = object;

export async function app(fastify: FastifyInstance, _opts: AppOptions) {
  fastify.register(fastifySwagger, docs);
  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  fastify.register(invoiceRoutes, { prefix: '/api/invoices' });
  fastify.register(paymentRoutes, { prefix: '/api/payments' });

  fastify.get('/health', async () => ({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  }));

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'full', deepLinking: false },
  });
}
