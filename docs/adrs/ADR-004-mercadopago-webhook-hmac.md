# ADR-004: Webhook Mercado Pago com Validação HMAC-SHA256

## Status

Aceito

## Contexto

O serviço de billing integra-se com o Mercado Pago para processamento de pagamentos. As notificações de mudança de status de pagamento (IPN — Instant Payment Notification) precisam ser recebidas de forma segura, garantindo autenticidade e integridade das notificações.

## Decisão

Implementamos um endpoint de webhook em `POST /api/webhooks/mercadopago` com as seguintes características:

### Validação de assinatura

- O Mercado Pago envia um header `x-signature` no formato `ts=<timestamp>,v1=<hmac>`.
- Construímos o manifest de validação: `id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;`.
- Computamos HMAC-SHA256 do manifest com o segredo `MERCADO_PAGO_WEBHOOK_SECRET`.
- Comparamos o HMAC computado com `v1` do header. Assinaturas inválidas retornam 401.

### Segurança

- O endpoint é excluído das rotas que requerem JWT auth (adicionado a `PUBLIC_PATHS`).
- A validação de assinatura é condicional — se `MERCADO_PAGO_WEBHOOK_SECRET` não estiver configurado, aceita sem validação (ambiente de desenvolvimento).
- Somente notificações do tipo `payment` são processadas.

### Resposta

- O endpoint responde imediatamente com 200 para evitar retransmissões do Mercado Pago.

## Consequências

- Notificações de pagamento são recebidas de forma segura e autenticada.
- A validação HMAC previne ataques de replay e falsificação de notificações.
- O endpoint segue as melhores práticas do Mercado Pago para integração IPN.
