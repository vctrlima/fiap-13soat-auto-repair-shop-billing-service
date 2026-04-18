# ADR-002: DynamoDB para Faturas e Pagamentos

## Status

Aceito

## Contexto

Faturas e pagamentos são documentos com schema flexível, acesso predominantemente por chave (workOrderId), e necessidade de alta disponibilidade e escalabilidade.

## Decisão

Adotamos **AWS DynamoDB** com:

- Tabela `Invoices`: PK = invoiceId, GSI em workOrderId
- Tabela `Payments`: PK = paymentId, GSI em invoiceId
- Acesso via AWS SDK v3 (@aws-sdk/client-dynamodb + lib-dynamodb)

## Consequências

- **Positivo**: Latência single-digit ms, escalabilidade automática, sem gestão de servidor
- **Negativo**: Sem suporte a joins (desnormalização necessária), consultas complexas requerem GSIs adicionais
