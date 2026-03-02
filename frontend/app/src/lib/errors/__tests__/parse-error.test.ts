import { describe, it, expect } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { parseErrorHoundError } from "../parse-error";
import { ErrorCodes } from "../error-codes";

function makeAxiosError(
  status: number,
  data: unknown
): AxiosError {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    data,
    headers: {},
    statusText: "Error",
    config: {} as AxiosResponse["config"],
  };
  return error;
}

describe("parseErrorHoundError", () => {
  it("extracts all fields from a well-formed ErrorHound response", () => {
    const error = makeAxiosError(400, {
      error: {
        code: ErrorCodes.VALIDATION,
        message: "Validation failed",
        details: { email: ["Email is required"] },
      },
      meta: { timestamp: "2026-01-01T00:00:00Z", version: "1.0" },
    });

    const result = parseErrorHoundError(error);

    expect(result).toEqual({
      status: 400,
      code: ErrorCodes.VALIDATION,
      message: "Validation failed",
      details: { email: ["Email is required"] },
      meta: { timestamp: "2026-01-01T00:00:00Z", version: "1.0" },
    });
  });

  it("falls back to defaults when response data is empty", () => {
    const error = makeAxiosError(500, {});

    const result = parseErrorHoundError(error);

    expect(result).toEqual({
      status: 500,
      code: ErrorCodes.UNKNOWN_ERROR,
      message: "An unexpected error occurred.",
      details: undefined,
      meta: undefined,
    });
  });

  it("falls back to defaults when response data is null", () => {
    const error = makeAxiosError(500, null);

    const result = parseErrorHoundError(error);

    expect(result).toEqual({
      status: 500,
      code: ErrorCodes.UNKNOWN_ERROR,
      message: "An unexpected error occurred.",
      details: undefined,
      meta: undefined,
    });
  });

  it("returns UNKNOWN_ERROR for network errors (no response)", () => {
    const error = new AxiosError("Network Error");

    const result = parseErrorHoundError(error);

    expect(result).toEqual({
      status: 0,
      code: ErrorCodes.UNKNOWN_ERROR,
      message: "An unexpected error occurred.",
    });
  });

  it("returns UNKNOWN_ERROR for non-Axios errors", () => {
    expect(parseErrorHoundError(new Error("something"))).toEqual({
      status: 0,
      code: ErrorCodes.UNKNOWN_ERROR,
      message: "An unexpected error occurred.",
    });

    expect(parseErrorHoundError("string error")).toEqual({
      status: 0,
      code: ErrorCodes.UNKNOWN_ERROR,
      message: "An unexpected error occurred.",
    });

    expect(parseErrorHoundError(null)).toEqual({
      status: 0,
      code: ErrorCodes.UNKNOWN_ERROR,
      message: "An unexpected error occurred.",
    });
  });

  it("extracts specific error codes correctly", () => {
    const error = makeAxiosError(401, {
      error: {
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: "Invalid email or password",
      },
    });

    const result = parseErrorHoundError(error);

    expect(result.status).toBe(401);
    expect(result.code).toBe(ErrorCodes.INVALID_CREDENTIALS);
    expect(result.message).toBe("Invalid email or password");
  });
});
