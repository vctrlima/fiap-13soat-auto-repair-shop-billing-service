import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';

export const docs: FastifyDynamicSwaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Billing & Payment Service',
      description: 'API documentation for the Billing & Payment microservice',
      version: '1.0.0',
    },
    servers: [{ url: '/', description: 'Current server' }],
    tags: [
      { name: 'invoice', description: 'Invoice end-points' },
      { name: 'payment', description: 'Payment end-points' },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from POST /api/auth/cpf (customer) or POST /api/auth/login (admin)',
        },
      },
    },
  },
};
