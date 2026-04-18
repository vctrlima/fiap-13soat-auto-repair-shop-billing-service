# ADR-003: Integração com Mercado Pago

## Status

Aceito

## Contexto

Necessidade de processamento de pagamentos reais com suporte a Pix e reembolsos automáticos como parte do fluxo da saga.

## Decisão

Integramos o **SDK oficial do Mercado Pago** (`mercadopago`) para:

- Criação de pagamentos via Pix (QR code)
- Consulta de status de pagamento
- Processamento de reembolsos (`PaymentRefund`)
- Gateway implementado como adapter na camada de infraestrutura (MercadoPagoPaymentGateway)

## Consequências

- **Positivo**: SDK tipado, suporte oficial, facilidade de sandbox para testes
- **Negativo**: Dependência de serviço externo, necessidade de access token em variável de ambiente
