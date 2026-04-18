# Billing & Payment Service

Microserviço responsável pela gestão de faturas e processamento de pagamentos, incluindo integração com Mercado Pago.

## Arquitetura

- **Clean Architecture**: domain → application → infra → presentation → main
- **Framework**: Fastify 5.2 + TypeScript 5.9
- **Banco de Dados**: AWS DynamoDB (tabelas Invoices e Payments)
- **Mensageria**: AWS SNS (publish) + AWS SQS (consume)
- **Porta**: 3003

## Integração Mercado Pago

- **PaymentGateway Protocol**: interface abstrata para gateways de pagamento
- **MercadoPagoPaymentGateway**: adapter que utiliza o SDK oficial `mercadopago`
- **Graceful degradation**: se o gateway falha, o processamento interno continua
- **Configuração**: ativado via `MERCADO_PAGO_ACCESS_TOKEN`

### Fluxo de Pagamento

1. Recebe evento `WorkOrderApproved` → cria fatura (Invoice)
2. POST `/api/payments` → processa pagamento:
   - Se Mercado Pago configurado: chama gateway primeiro
   - Gateway aprova → persiste COMPLETED + publica `PaymentCompleted`
   - Gateway rejeita → persiste FAILED + publica `PaymentFailed`
   - Gateway erro → fallback para processamento interno
3. Recebe evento `WorkOrderCanceled` → estorna pagamento se necessário

## Endpoints

| Método | Rota                                | Descrição               |
| ------ | ----------------------------------- | ----------------------- |
| GET    | `/api/invoices/:workOrderId`        | Buscar fatura por OS    |
| POST   | `/api/payments`                     | Processar pagamento     |
| GET    | `/api/payments/:workOrderId`        | Buscar pagamento por OS |
| POST   | `/api/payments/:workOrderId/refund` | Solicitar estorno       |

## Variáveis de Ambiente

| Variável                           | Descrição                     | Padrão    |
| ---------------------------------- | ----------------------------- | --------- |
| `SERVER_PORT`                      | Porta do servidor             | 3003      |
| `AWS_REGION`                       | Região AWS                    | us-east-2 |
| `AWS_ENDPOINT_URL`                 | Endpoint LocalStack (dev)     | —         |
| `SNS_PAYMENT_EVENTS_TOPIC_ARN`     | ARN tópico SNS de pagamentos  | —         |
| `SQS_BILLING_WORK_ORDER_QUEUE_URL` | URL fila SQS                  | —         |
| `DYNAMODB_INVOICES_TABLE`          | Nome tabela DynamoDB          | Invoices  |
| `DYNAMODB_PAYMENTS_TABLE`          | Nome tabela DynamoDB          | Payments  |
| `MERCADO_PAGO_ACCESS_TOKEN`        | Token Mercado Pago (opcional) | —         |
| `CORS_ORIGIN`                      | Origem CORS permitida         | `*`       |

## Execução Local

```bash
yarn install
yarn start:dev
```

## Testes

```bash
yarn test          # 9 suites, 32 testes
```

- Cobertura mínima: 80%

## Docker

```bash
docker compose up -d
```

## CI/CD

Pipeline GitHub Actions: lint → test → build → push ECR → deploy EKS
