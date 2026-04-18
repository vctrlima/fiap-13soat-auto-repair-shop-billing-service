Feature: Billing and Invoice Management

  As a billing system
  I want to manage invoices and payments for work orders
  So that customers can be properly billed and refunded

  Background:
    Given the billing service is running

  Scenario: Create invoice from work order approved event
    Given a WorkOrderApproved event is received via SQS
    When the billing event handler processes the event
    Then an invoice should be created with status "PENDING"
    And the invoice amount should match the work order budget

  Scenario: Process payment for an invoice
    Given an invoice exists with status "PENDING"
    When I submit a PIX payment for the invoice
    Then the payment should be recorded with status "COMPLETED"
    And a PaymentCompleted event should be published to SNS

  Scenario: Cancel invoice and trigger refund
    Given an invoice exists with status "PAID"
    When a WorkOrderCanceled event is received for that work order
    Then a refund should be processed
    And the invoice status should be updated to "CANCELED"

  Scenario: Query invoice by work order ID
    Given an invoice exists for a work order
    When I query the invoice by work order ID
    Then I should receive the invoice details with correct amounts

  Scenario: Payment failure publishes failure event
    Given an invoice exists with status "PENDING"
    When a payment processing error occurs
    Then a PaymentFailed event should be published to SNS
    And the invoice status should remain "PENDING"
