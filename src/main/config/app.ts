import { registerAuthHook } from "@/main/middlewares/auth-hook";
import { invoiceRoutes, paymentRoutes } from "@/main/routes";
import { webhookRoutes } from "@/main/routes/webhook-routes";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";
import { docs } from "./docs";
import env from "./env";

export type AppOptions = object;

export async function app(fastify: FastifyInstance, _opts: AppOptions) {
  fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  });
  fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  fastify.register(fastifySwagger, docs);
  fastify.register(cors, {
    origin: env.corsOrigin
      ? env.corsOrigin.split(",").map((o) => o.trim())
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  registerAuthHook(fastify, env.jwtSecret);

  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Unhandled error");
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      statusCode,
      error: statusCode >= 500 ? "Internal Server Error" : error.name,
      message:
        statusCode >= 500 ? "An unexpected error occurred" : error.message,
    });
  });

  fastify.register(invoiceRoutes, { prefix: "/api/invoices" });
  fastify.register(paymentRoutes, { prefix: "/api/payments" });
  fastify.register(webhookRoutes, { prefix: "/api/webhooks" });

  fastify.get("/health", async () => ({
    status: "UP",
    timestamp: new Date().toISOString(),
  }));

  fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "full", deepLinking: false },
  });
}
