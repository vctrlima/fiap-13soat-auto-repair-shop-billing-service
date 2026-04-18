import { AccessDeniedError } from "@/presentation/errors/access-denied-error";
import { MissingParamError } from "@/presentation/errors/missing-param-error";
import { NotFoundError } from "@/presentation/errors/not-found-error";
import { ServerError } from "@/presentation/errors/server-error";
import { UnauthorizedError } from "@/presentation/errors/unauthorized-error";

describe("AccessDeniedError", () => {
  it("should set message and name", () => {
    const error = new AccessDeniedError();
    expect(error.message).toBe("Access denied");
    expect(error.name).toBe("AccessDeniedError");
  });
});

describe("UnauthorizedError", () => {
  it("should set message and name", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
    expect(error.name).toBe("UnauthorizedError");
  });
});

describe("MissingParamError", () => {
  it("should set message and name", () => {
    const error = new MissingParamError("field");
    expect(error.message).toBe("Missing param: field");
    expect(error.name).toBe("MissingParamError");
  });
});

describe("NotFoundError", () => {
  it("should set message, name and stack", () => {
    const error = new NotFoundError("trace");
    expect(error.message).toBe("Not found error");
    expect(error.name).toBe("NotFoundError");
    expect(error.stack).toBe("trace");
  });
});

describe("ServerError", () => {
  it("should set message, name and stack", () => {
    const error = new ServerError("trace");
    expect(error.message).toBe("Internal server error");
    expect(error.name).toBe("ServerError");
    expect(error.stack).toBe("trace");
  });
});
