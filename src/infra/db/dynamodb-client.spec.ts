const mockSend = jest.fn();
const mockExecute = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({ send: mockSend })),
  },
}));

jest.mock("@/infra/circuit-breaker", () => ({
  databaseCircuitBreaker: { execute: mockExecute },
}));

describe("dynamodb-client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should wrap send calls through the circuit breaker", async () => {
    const expectedResult = { Items: [{ id: "1" }] };
    mockExecute.mockImplementation((fn: () => Promise<any>) => fn());
    mockSend.mockResolvedValue(expectedResult);

    const { dynamodb } = require("@/infra/db/dynamodb-client");

    const fakeCommand = { input: {} };
    const result = await dynamodb.send(fakeCommand);

    expect(mockExecute).toHaveBeenCalledWith(expect.any(Function));
    expect(result).toEqual(expectedResult);
  });

  it("should propagate circuit breaker errors on send", async () => {
    mockExecute.mockRejectedValue(
      new Error(
        "Circuit breaker [dynamodb] is OPEN — requests are temporarily blocked",
      ),
    );

    const { dynamodb } = require("@/infra/db/dynamodb-client");

    await expect(dynamodb.send({ input: {} })).rejects.toThrow(
      "Circuit breaker [dynamodb] is OPEN",
    );
  });

  it("should propagate DynamoDB errors through the circuit breaker", async () => {
    mockExecute.mockImplementation((fn: () => Promise<any>) => fn());
    mockSend.mockRejectedValue(new Error("ConditionalCheckFailedException"));

    const { dynamodb } = require("@/infra/db/dynamodb-client");

    await expect(dynamodb.send({ input: {} })).rejects.toThrow(
      "ConditionalCheckFailedException",
    );
  });

  it("should pass through non-send properties without wrapping", () => {
    require("@/infra/db/dynamodb-client");
    // Accessing a non-send property should not trigger circuit breaker
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
