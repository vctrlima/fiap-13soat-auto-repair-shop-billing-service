import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const PUBLIC_PATHS = ["/health", "/docs", "/api/webhooks"];

/**
 * Write methods that require admin role (type: 'admin' in the JWT).
 * GET / HEAD requests are accessible to both customer and admin tokens.
 */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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
        }) as jwt.JwtPayload;
        (request as any).user = decoded;

        if (WRITE_METHODS.has(request.method) && decoded["type"] !== "admin") {
          reply
            .status(403)
            .send({ error: "Admin privileges required for this operation" });
          return;
        }
      } catch {
        reply.status(401).send({ error: "Invalid or expired token" });
        return;
      }
    },
  );
}
