import { describe, it, expect } from "vitest";
import { isValidationError, isFormLevelError, isSystemError, isRateLimitError, isConflictError } from "../is-validation-error";
import { ErrorCodes } from "../error-codes";
import type { ErrorHoundClientError } from "../types";

function makeError(overrides: Partial<ErrorHoundClientError>): ErrorHoundClientError {
  return {
    status: 400,
    code: ErrorCodes.UNKNOWN_ERROR,
    message: "Test error",
    ...overrides,
  };
}

describe("isValidationError", () => {
  it("returns true for a proper validation error", () => {
    const error = makeError({
      status: 400,
      code: ErrorCodes.VALIDATION,
      details: { email: ["Email is required"] },
    });
    expect(isValidationError(error)).toBe(true);
  });

  it("returns false when status is not 400", () => {
    const error = makeError({
      status: 422,
      code: ErrorCodes.VALIDATION,
      details: { email: ["Email is required"] },
    });
    expect(isValidationError(error)).toBe(false);
  });

  it("returns false when code is not VALIDATION", () => {
    const error = makeError({
      status: 400,
      code: ErrorCodes.BAD_REQUEST,
      details: { email: ["Email is required"] },
    });
    expect(isValidationError(error)).toBe(false);
  });

  it("returns false when details is null or undefined", () => {
    expect(
      isValidationError(makeError({ status: 400, code: ErrorCodes.VALIDATION, details: null }))
    ).toBe(false);

    expect(
      isValidationError(makeError({ status: 400, code: ErrorCodes.VALIDATION, details: undefined }))
    ).toBe(false);
  });

  it("returns false when details is a string instead of object", () => {
    expect(
      isValidationError(
        makeError({ status: 400, code: ErrorCodes.VALIDATION, details: "not an object" as unknown })
      )
    ).toBe(false);
  });
});

describe("isFormLevelError", () => {
  const formLevelCodes = [
    ErrorCodes.INVALID_CREDENTIALS,
    ErrorCodes.INCORRECT_PASSWORD,
    ErrorCodes.EMAIL_NOT_VERIFIED,
    ErrorCodes.ACCOUNT_LOCKED,
  ];

  it.each(formLevelCodes)("returns true for %s", (code) => {
    expect(isFormLevelError(makeError({ code }))).toBe(true);
  });

  it("returns false for non-form-level codes", () => {
    expect(isFormLevelError(makeError({ code: ErrorCodes.NOT_FOUND }))).toBe(false);
    expect(isFormLevelError(makeError({ code: ErrorCodes.VALIDATION }))).toBe(false);
    expect(isFormLevelError(makeError({ code: ErrorCodes.INTERNAL_ERROR }))).toBe(false);
    expect(isFormLevelError(makeError({ code: ErrorCodes.UNKNOWN_ERROR }))).toBe(false);
  });
});

describe("isSystemError", () => {
  it("returns true for status >= 500", () => {
    expect(isSystemError(makeError({ status: 500 }))).toBe(true);
    expect(isSystemError(makeError({ status: 502 }))).toBe(true);
    expect(isSystemError(makeError({ status: 503 }))).toBe(true);
  });

  it("returns true for INTERNAL_ERROR code regardless of status", () => {
    expect(isSystemError(makeError({ status: 400, code: ErrorCodes.INTERNAL_ERROR }))).toBe(true);
  });

  it("returns true for INTERNAL_SERVER code", () => {
    expect(isSystemError(makeError({ status: 400, code: ErrorCodes.INTERNAL_SERVER }))).toBe(true);
  });

  it("returns true for DATABASE code", () => {
    expect(isSystemError(makeError({ status: 400, code: ErrorCodes.DATABASE }))).toBe(true);
  });

  it("returns true for SERVICE_UNAVAILABLE code regardless of status", () => {
    expect(isSystemError(makeError({ status: 400, code: ErrorCodes.SERVICE_UNAVAILABLE }))).toBe(true);
  });

  it("returns true for TIMEOUT code", () => {
    expect(isSystemError(makeError({ status: 400, code: ErrorCodes.TIMEOUT }))).toBe(true);
  });

  it("returns false for client errors without system codes", () => {
    expect(isSystemError(makeError({ status: 400, code: ErrorCodes.VALIDATION }))).toBe(false);
    expect(isSystemError(makeError({ status: 401, code: ErrorCodes.UNAUTHORIZED }))).toBe(false);
    expect(isSystemError(makeError({ status: 404, code: ErrorCodes.NOT_FOUND }))).toBe(false);
  });
});

describe("isRateLimitError", () => {
  it("returns true for status 429", () => {
    expect(isRateLimitError(makeError({ status: 429 }))).toBe(true);
  });

  it("returns true for TOO_MANY_REQUESTS code regardless of status", () => {
    expect(isRateLimitError(makeError({ status: 400, code: ErrorCodes.TOO_MANY_REQUESTS }))).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isRateLimitError(makeError({ status: 400, code: ErrorCodes.VALIDATION }))).toBe(false);
    expect(isRateLimitError(makeError({ status: 500, code: ErrorCodes.INTERNAL_ERROR }))).toBe(false);
  });
});

describe("isConflictError", () => {
  it("returns true for CONFLICT code", () => {
    expect(isConflictError(makeError({ code: ErrorCodes.CONFLICT }))).toBe(true);
  });

  it("returns false for other codes", () => {
    expect(isConflictError(makeError({ code: ErrorCodes.VALIDATION }))).toBe(false);
    expect(isConflictError(makeError({ code: ErrorCodes.BAD_REQUEST }))).toBe(false);
    expect(isConflictError(makeError({ code: ErrorCodes.NOT_FOUND }))).toBe(false);
  });
});
