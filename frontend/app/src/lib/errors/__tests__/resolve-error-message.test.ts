import { describe, it, expect } from "vitest";
import { resolveErrorMessage } from "../resolve-error-message";
import { ErrorCodes } from "../error-codes";
import type { ErrorHoundClientError } from "../types";

const baseError: ErrorHoundClientError = {
  status: 400,
  code: ErrorCodes.INVALID_CREDENTIALS,
  message: "Invalid email or password",
};

describe("resolveErrorMessage", () => {
  it("returns the server message when no resolver is provided", () => {
    expect(resolveErrorMessage(baseError)).toBe("Invalid email or password");
  });

  it("returns the server message when resolver returns undefined", () => {
    const resolver = () => undefined;
    expect(resolveErrorMessage(baseError, resolver)).toBe("Invalid email or password");
  });

  it("returns the server message when resolver returns empty string", () => {
    const resolver = () => "";
    expect(resolveErrorMessage(baseError, resolver)).toBe("Invalid email or password");
  });

  it("returns the resolved message when resolver returns a string", () => {
    const resolver = () => "Custom error message";
    expect(resolveErrorMessage(baseError, resolver)).toBe("Custom error message");
  });

  it("passes the error to the resolver function", () => {
    const resolver = (error: ErrorHoundClientError) => {
      if (error.code === ErrorCodes.INVALID_CREDENTIALS) {
        return "Wrong credentials, try again";
      }
      return undefined;
    };

    expect(resolveErrorMessage(baseError, resolver)).toBe("Wrong credentials, try again");

    const otherError: ErrorHoundClientError = {
      status: 500,
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Server error",
    };
    expect(resolveErrorMessage(otherError, resolver)).toBe("Server error");
  });
});
