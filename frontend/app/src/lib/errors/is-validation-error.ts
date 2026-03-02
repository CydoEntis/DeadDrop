import type { ErrorHoundClientError } from "./types";
import { ErrorCodes } from "./error-codes";

/**
 * Check if error is a field validation error (VALIDATION with field details)
 */
export function isValidationError(error: ErrorHoundClientError): boolean {
  return (
    error.status === 400 &&
    error.code === ErrorCodes.VALIDATION &&
    typeof error.details === "object" &&
    error.details !== null
  );
}

/**
 * Check if error is a form-level authentication error
 * These should be displayed as form-level errors, not toasts
 */
export function isFormLevelError(error: ErrorHoundClientError): boolean {
  const formLevelCodes: string[] = [
    ErrorCodes.INVALID_CREDENTIALS,
    ErrorCodes.INCORRECT_PASSWORD,
    ErrorCodes.EMAIL_NOT_VERIFIED,
    ErrorCodes.ACCOUNT_LOCKED,
  ];
  return formLevelCodes.includes(error.code);
}

/**
 * Check if error is a system error that should be shown as a toast
 */
export function isSystemError(error: ErrorHoundClientError): boolean {
  return (
    error.status >= 500 ||
    error.code === ErrorCodes.INTERNAL_ERROR ||
    error.code === ErrorCodes.INTERNAL_SERVER ||
    error.code === ErrorCodes.DATABASE ||
    error.code === ErrorCodes.SERVICE_UNAVAILABLE ||
    error.code === ErrorCodes.TIMEOUT
  );
}

/**
 * Check if error is a rate limit error (429 Too Many Requests)
 */
export function isRateLimitError(error: ErrorHoundClientError): boolean {
  return error.status === 429 || error.code === ErrorCodes.TOO_MANY_REQUESTS;
}

/**
 * Check if error is a conflict error (409 Conflict)
 */
export function isConflictError(error: ErrorHoundClientError): boolean {
  return error.code === ErrorCodes.CONFLICT;
}
