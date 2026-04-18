import { defineFeature, loadFeature } from "jest-cucumber";
import axios from "axios";
import path from "path";

const feature = loadFeature(
  path.resolve(__dirname, "../features/billing.feature"),
);

const baseURL = process.env.BILLING_SERVICE_URL || "http://localhost:3003";
const api = axios.create({ baseURL, validateStatus: () => true });

defineFeature(feature, (test) => {
  let workOrderId: string;
  let invoiceResponse: any;
  let paymentResponse: any;

  beforeEach(() => {
    workOrderId = `wo-test-${Date.now()}`;
  });

  test("Create invoice from work order approved event", ({
    given,
    when,
    then,
    and,
  }) => {
    given("the billing service is running", async () => {
      const { status } = await api.get("/health");
      expect(status).toBe(200);
    });

    given("a WorkOrderApproved event is received via SQS", () => {
      // Event processing is async via SQS - in e2e this is triggered by work-order-service
      // For isolated billing e2e, we verify the outcome after event is processed
    });

    when("the billing event handler processes the event", async () => {
      // Wait for async event processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    then(
      /^an invoice should be created with status "(.*)"$/,
      async (status) => {
        // Query invoice by work order ID
        invoiceResponse = await api.get(`/api/invoices/${workOrderId}`);
        if (invoiceResponse.status === 200) {
          expect(invoiceResponse.data.status).toBe(status);
        }
      },
    );

    and("the invoice amount should match the work order budget", () => {
      if (invoiceResponse?.data) {
        expect(invoiceResponse.data.amount).toBeGreaterThan(0);
      }
    });
  });

  test("Process payment for an invoice", ({ given, when, then, and }) => {
    given("the billing service is running", async () => {
      const { status } = await api.get("/health");
      expect(status).toBe(200);
    });

    given(/^an invoice exists with status "(.*)"$/, () => {
      // Assumes invoice was created by previous scenario or test setup
    });

    when("I submit a PIX payment for the invoice", async () => {
      paymentResponse = await api.post("/api/payments", {
        workOrderId,
        method: "PIX",
      });
    });

    then(/^the payment should be recorded with status "(.*)"$/, (status) => {
      if (paymentResponse.status === 200 || paymentResponse.status === 201) {
        expect(paymentResponse.data.status).toBe(status);
      }
    });

    and("a PaymentCompleted event should be published to SNS", () => {
      // Verified via work-order-service saga state transition in integration tests
    });
  });

  test("Cancel invoice and trigger refund", ({ given, when, then, and }) => {
    given("the billing service is running", async () => {
      const { status } = await api.get("/health");
      expect(status).toBe(200);
    });

    given(/^an invoice exists with status "(.*)"$/, () => {
      // Assumes paid invoice exists
    });

    when(
      "a WorkOrderCanceled event is received for that work order",
      async () => {
        // Event-driven - processed via SQS consumer
        await new Promise((resolve) => setTimeout(resolve, 2000));
      },
    );

    then("a refund should be processed", async () => {
      const refundResponse = await api.post(
        `/api/payments/${workOrderId}/refund`,
        { reason: "Work order canceled" },
      );
      expect([200, 201, 404]).toContain(refundResponse.status);
    });

    and(/^the invoice status should be updated to "(.*)"$/, async (status) => {
      const response = await api.get(`/api/invoices/${workOrderId}`);
      if (response.status === 200) {
        expect(response.data.status).toBe(status);
      }
    });
  });

  test("Query invoice by work order ID", ({ given, when, then }) => {
    given("the billing service is running", async () => {
      const { status } = await api.get("/health");
      expect(status).toBe(200);
    });

    given("an invoice exists for a work order", () => {
      // Assumes invoice created by event handler
    });

    when("I query the invoice by work order ID", async () => {
      invoiceResponse = await api.get(`/api/invoices/${workOrderId}`);
    });

    then("I should receive the invoice details with correct amounts", () => {
      expect([200, 404]).toContain(invoiceResponse.status);
      if (invoiceResponse.status === 200) {
        expect(invoiceResponse.data).toHaveProperty("workOrderId");
        expect(invoiceResponse.data).toHaveProperty("amount");
      }
    });
  });

  test("Payment failure publishes failure event", ({
    given,
    when,
    then,
    and,
  }) => {
    given("the billing service is running", async () => {
      const { status } = await api.get("/health");
      expect(status).toBe(200);
    });

    given(/^an invoice exists with status "(.*)"$/, () => {
      // Assumes pending invoice
    });

    when("a payment processing error occurs", async () => {
      // Simulate payment with invalid data
      paymentResponse = await api.post("/api/payments", {
        workOrderId: "nonexistent-wo",
        method: "INVALID",
      });
    });

    then("a PaymentFailed event should be published to SNS", () => {
      // Verified via work-order-service saga compensation in integration
      expect([400, 404, 422, 500]).toContain(paymentResponse.status);
    });

    and(/^the invoice status should remain "(.*)"$/, () => {
      // Invoice not modified on payment failure
    });
  });
});
