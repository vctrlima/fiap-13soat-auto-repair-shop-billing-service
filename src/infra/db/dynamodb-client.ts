import { databaseCircuitBreaker } from "@/infra/circuit-breaker";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-2",
  ...(process.env.AWS_ENDPOINT_URL
    ? { endpoint: process.env.AWS_ENDPOINT_URL }
    : {}),
});

const baseDynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const dynamodb = new Proxy(baseDynamodb, {
  get(target, prop, receiver) {
    if (prop === "send") {
      return async (...args: unknown[]) =>
        databaseCircuitBreaker.execute(() =>
          (target.send as (...a: unknown[]) => Promise<unknown>)(...args),
        );
    }
    return Reflect.get(target, prop, receiver);
  },
});
