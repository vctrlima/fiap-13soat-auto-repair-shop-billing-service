import env from "@/main/config/env";
import {
  makeGetInvoiceByWorkOrderId,
  makeProcessPayment,
} from "@/main/factories/use-cases";
import { FastifyInstance } from "fastify";
import crypto from "node:crypto";

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/mercadopago",
    {
      schema: {
        tags: ["Webhook"],
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
      const webhookSecret = env.mercadoPagoWebhookSecret;
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

        if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1 ?? ""))) {
          return reply.status(401).send({ error: "Invalid signature" });
        }
      }

      const body = request.body as any;
      const { action, type, data } = body;

      if (type !== "payment") {
        return reply.status(200).send({ received: true });
      }

      reply.status(200).send({ received: true });

      try {
        const externalRef = data?.external_reference as string | undefined;
        if (!externalRef) {
          fastify.log.warn(
            { paymentId: data?.id },
            "Webhook: no external_reference",
          );
          return;
        }

        const [workOrderId, invoiceId] = externalRef.split(":");
        if (!workOrderId || !invoiceId) {
          fastify.log.warn(
            { externalRef },
            "Webhook: malformed external_reference",
          );
          return;
        }

        const status = action === "payment.approved" ? "COMPLETED" : "FAILED";

        const processPayment = makeProcessPayment();
        const invoice = await makeGetInvoiceByWorkOrderId().getByWorkOrderId({
          workOrderId,
        });
        if (!invoice) {
          fastify.log.warn({ workOrderId }, "Webhook: no invoice found");
          return;
        }

        await processPayment.process({
          workOrderId,
          invoiceId,
          amount: invoice.amount,
          method: "PIX",
        });

        fastify.log.info(
          { workOrderId, paymentId: data?.id, status },
          "Webhook: payment processed",
        );
      } catch (error) {
        fastify.log.error(
          { err: error, paymentId: data?.id },
          "Webhook: processing failed",
        );
      }
    },
  );
}
