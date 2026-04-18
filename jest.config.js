/** @type {import('jest').Config} */
module.exports = {
  displayName: "@fiap-13soat/billing-service",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        configFile: ".spec.swcrc",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/main/**",
    "!src/**/*.spec.ts",
    "!src/**/*.d.ts",
    "!src/infra/observability/**",
    "!src/infra/db/dynamodb-client.ts",
    "!src/**/index.ts",
    "!src/infra/messaging/sqs-event-consumer.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
