import type { ErrorHoundClientError } from "./types";
import { isValidationError } from "./is-validation-error";

/**
 * Apply field-level validation errors to a React Hook Form.
 * Handles the Pawthorize error format where details is Record<string, string[]>
 * Converts PascalCase field names to camelCase to match React Hook Form field names.
 *
 * @param error - The error from the server
 * @param setError - The setError function from react-hook-form's useForm
 * @returns true if validation errors were applied, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyServerErrorsToForm(
  error: ErrorHoundClientError,
  setError: (name: any, error: { type: string; message: string }) => void
): boolean {
  if (!isValidationError(error)) return false;

  const details = error.details as Record<string, string[]>;

  Object.entries(details).forEach(([field, messages]) => {
    const fieldName = field.charAt(0).toLowerCase() + field.slice(1);
    const message = Array.isArray(messages) ? messages[0] : messages;

    setError(fieldName, {
      type: "server",
      message,
    });
  });

  return true;
}
