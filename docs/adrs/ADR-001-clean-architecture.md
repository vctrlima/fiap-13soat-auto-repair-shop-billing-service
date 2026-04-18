# ADR-001: Adoção de Clean Architecture

## Status

Aceito

## Contexto

O serviço de Faturamento e Pagamentos gerencia faturas, processamento de pagamentos (integração Mercado Pago) e reembolsos.

## Decisão

Adotamos **Clean Architecture** com as mesmas camadas padronizadas dos demais serviços: Domain, Application, Infra, Main e Presentation.

## Consequências

- **Positivo**: Gateway de pagamento facilmente substituível (interface PaymentGateway), lógica de negócio isolada
- **Negativo**: Overhead de abstrações para operações CRUD simples
