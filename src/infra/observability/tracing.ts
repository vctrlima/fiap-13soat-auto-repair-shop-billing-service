import * as dotenv from "dotenv";
dotenv.config();

import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const isEnabled = process.env.OTEL_ENABLED === "true";
const serviceName = process.env.OTEL_SERVICE_NAME || "billing-service";
const serviceVersion = process.env.npm_package_version || "1.0.0";
const environment = process.env.NODE_ENV || "development";
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

if (process.env.OTEL_DEBUG === "true") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

let sdk: NodeSDK | undefined;

if (isEnabled) {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    "deployment.environment.name": environment,
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${otlpEndpoint}/v1/metrics`,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 30000,
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-http": {
          ignoreIncomingRequestHook: (request) => {
            const url = request.url || "";
            return url === "/health" || url.startsWith("/documentation");
          },
        },
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
  console.log(`[OTEL] Telemetry enabled — exporting to ${otlpEndpoint}`);
}

const shutdown = async (): Promise<void> => {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log("[OTEL] Telemetry shut down successfully");
    } catch (err) {
      console.error("[OTEL] Error shutting down telemetry", err);
    }
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { sdk, shutdown };
