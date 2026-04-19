# Multi-stage Dockerfile for Billing & Payment Service (no Prisma — uses DynamoDB)
FROM docker.io/node:22-alpine3.20 AS builder

WORKDIR /app

RUN corepack enable && \
    corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --network-timeout 300000

COPY tsconfig*.json ./
COPY eslint.config.mjs ./
COPY src ./src

RUN yarn build

FROM docker.io/node:22-alpine3.20

ENV HOST=0.0.0.0
ENV PORT=3003
ENV NODE_ENV=production

RUN corepack enable && \
    corepack prepare yarn@1.22.22 --activate

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --production --frozen-lockfile --network-timeout 300000 && \
    yarn add tsconfig-paths module-alias

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig*.json ./

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3003/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "-r", "tsconfig-paths/register", "-r", "module-alias/register", "dist/main.js"]
