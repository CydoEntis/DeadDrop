import { describe, it, expect, vi } from "vitest";
import { applyServerErrorsToForm } from "../react-hook-form";
import { ErrorCodes } from "../error-codes";
import type { ErrorHoundClientError } from "../types";

describe("applyServerErrorsToForm", () => {
  it("applies field errors from a validation error and returns true", () => {
    const error: ErrorHoundClientError = {
      status: 400,
      code: ErrorCodes.VALIDATION,
      message: "Validation failed",
      details: {
        Email: ["Email is required"],
        Password: ["Password must be at least 8 characters"],
      },
    };

    const setError = vi.fn();
    const result = applyServerErrorsToForm(error, setError);

    expect(result).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Email is required",
    });
    expect(setError).toHaveBeenCalledWith("password", {
      type: "server",
      message: "Password must be at least 8 characters",
    });
  });

  it("converts PascalCase field names to camelCase", () => {
    const error: ErrorHoundClientError = {
      status: 400,
      code: ErrorCodes.VALIDATION,
      message: "Validation failed",
      details: {
        CurrentPassword: ["Current password is required"],
        NewEmail: ["Email is invalid"],
      },
    };

    const setError = vi.fn();
    applyServerErrorsToForm(error, setError);

    expect(setError).toHaveBeenCalledWith("currentPassword", {
      type: "server",
      message: "Current password is required",
    });
    expect(setError).toHaveBeenCalledWith("newEmail", {
      type: "server",
      message: "Email is invalid",
    });
  });

  it("uses only the first message when multiple are provided", () => {
    const error: ErrorHoundClientError = {
      status: 400,
      code: ErrorCodes.VALIDATION,
      message: "Validation failed",
      details: {
        Email: ["Email is required", "Email must be valid"],
      },
    };

    const setError = vi.fn();
    applyServerErrorsToForm(error, setError);

    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Email is required",
    });
  });

  it("returns false and does not call setError for non-validation errors", () => {
    const error: ErrorHoundClientError = {
      status: 401,
      code: ErrorCodes.INVALID_CREDENTIALS,
      message: "Invalid email or password",
    };

    const setError = vi.fn();
    const result = applyServerErrorsToForm(error, setError);

    expect(result).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("returns false for system errors", () => {
    const error: ErrorHoundClientError = {
      status: 500,
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Something went wrong",
    };

    const setError = vi.fn();
    const result = applyServerErrorsToForm(error, setError);

    expect(result).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
