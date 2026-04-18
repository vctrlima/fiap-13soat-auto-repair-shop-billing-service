import { FastifyInstance } from "fastify";
import crypto from "node:crypto";

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/mercadopago",
    {
      schema: {
        tags: ["webhook"],
        summary: "Mercado Pago IPN webhook",
        body: {
          type: "object",
          properties: {
            action: { type: "string" },
            type: { type: "string" },
            data: {
              type: "object",
              properties: { id: { type: "string" } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = request.headers["x-signature"] as string;
        if (!signature) {
          return reply.status(401).send({ error: "Missing signature" });
        }

        const parts = signature.split(",").reduce(
          (acc, part) => {
            const [key, value] = part.split("=");
            acc[key.trim()] = value?.trim();
            return acc;
          },
          {} as Record<string, string>,
        );

        const ts = parts["ts"];
        const v1 = parts["v1"];
        const body = request.body as any;

        const manifest = `id:${body?.data?.id};request-id:${request.headers["x-request-id"]};ts:${ts};`;
        const hmac = crypto
          .createHmac("sha256", webhookSecret)
          .update(manifest)
          .digest("hex");

        if (hmac !== v1) {
          return reply.status(401).send({ error: "Invalid signature" });
        }
      }

      const body = request.body as any;
      const { action, type, data } = body;

      if (type !== "payment") {
        return reply.status(200).send({ received: true });
      }

      fastify.log.info(
        `[Webhook] Mercado Pago payment notification: action=${action}, paymentId=${data?.id}`,
      );

      // Acknowledge immediately — process async
      reply.status(200).send({ received: true });
    },
  );
}
