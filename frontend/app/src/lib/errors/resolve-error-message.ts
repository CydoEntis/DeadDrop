import type { ErrorHoundClientError } from "./types";

export type ErrorMessageResolver = (error: ErrorHoundClientError) => string | undefined;

/**
 * Returns a string message for an error.
 * - If a resolver is provided and returns a string, use it.
 * - Otherwise, fall back to the server-provided message.
 */
export function resolveErrorMessage(error: ErrorHoundClientError, resolver?: ErrorMessageResolver): string {
  const resolved = resolver?.(error);
  if (typeof resolved === "string" && resolved.length > 0) {
    return resolved;
  }
  return error.message;
}
