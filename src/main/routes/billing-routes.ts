import { buildRoute } from "@/main/adapters";
import {
  errorResponseSchema,
  invoiceResponseSchema,
  paymentResponseSchema,
} from "@/main/docs/schemas";
import {
  makeGetInvoiceController,
  makeGetPaymentsController,
} from "@/main/factories/controllers";
import {
  makeProcessPayment,
  makeProcessRefund,
} from "@/main/factories/use-cases";
import { FastifyInstance } from "fastify";

export async function invoiceRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:workOrderId",
    {
      schema: {
        tags: ["invoice"],
        summary: "Get invoice by work order ID",
        params: {
          type: "object",
          properties: { workOrderId: { type: "string" } },
          required: ["workOrderId"],
        },
        response: { 200: invoiceResponseSchema, 404: errorResponseSchema },
      },
    },
    buildRoute(makeGetInvoiceController()),
  );
}

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["payment"],
        summary: "Process a payment",
        body: {
          type: "object",
          required: ["workOrderId", "invoiceId", "amount", "method"],
          properties: {
            workOrderId: { type: "string" },
            invoiceId: { type: "string" },
            amount: { type: "number" },
            method: {
              type: "string",
              enum: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BANK_TRANSFER"],
            },
          },
        },
        response: { 201: paymentResponseSchema, 400: errorResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const processPayment = makeProcessPayment();
        const result = await processPayment.process(request.body as any);
        reply.status(201).send(result);
      } catch (error: any) {
        reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/:workOrderId",
    {
      schema: {
        tags: ["payment"],
        summary: "Get payments by work order ID",
        params: {
          type: "object",
          properties: { workOrderId: { type: "string" } },
          required: ["workOrderId"],
        },
        response: {
          200: { type: "array", items: paymentResponseSchema },
          400: errorResponseSchema,
        },
      },
    },
    buildRoute(makeGetPaymentsController()),
  );

  fastify.post(
    "/:workOrderId/refund",
    {
      schema: {
        tags: ["payment"],
        summary: "Process a refund for a work order",
        params: {
          type: "object",
          properties: { workOrderId: { type: "string" } },
          required: ["workOrderId"],
        },
        body: {
          type: "object",
          properties: { reason: { type: "string" } },
        },
        response: { 200: paymentResponseSchema, 400: errorResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const processRefund = makeProcessRefund();
        const result = await processRefund.refund({
          workOrderId: (request.params as any).workOrderId,
          reason: (request.body as any)?.reason,
        });
        reply.status(200).send(result);
      } catch (error: any) {
        reply.status(400).send({ error: error.message });
      }
    },
  );
}
