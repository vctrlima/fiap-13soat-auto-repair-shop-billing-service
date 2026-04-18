import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const PUBLIC_PATHS = ["/health", "/docs", "/api/webhooks"];

export function registerAuthHook(
  fastify: FastifyInstance,
  jwtSecret: string,
): void {
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const url = request.url;

      if (
        PUBLIC_PATHS.some((path) => url === path || url.startsWith(path + "/"))
      ) {
        return;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        reply
          .status(401)
          .send({ error: "Missing or invalid authorization header" });
        return;
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, jwtSecret, {
          issuer: "https://auto-repair-shop.auth",
          audience: "auto-repair-shop-api",
        });
        (request as any).user = decoded;
      } catch {
        reply.status(401).send({ error: "Invalid or expired token" });
        return;
      }
    },
  );
}
