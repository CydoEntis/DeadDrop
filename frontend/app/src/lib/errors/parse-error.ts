import { AxiosError } from "axios";
import type { ErrorHoundClientError } from "./types";
import { ErrorCodes } from "./error-codes";

export function parseErrorHoundError(error: unknown): ErrorHoundClientError {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data;

    return {
      status: error.response.status,
      code: data?.error?.code ?? ErrorCodes.UNKNOWN_ERROR,
      message: data?.error?.message ?? "An unexpected error occurred.",
      details: data?.error?.details,
      meta: data?.meta,
    };
  }

  return {
    status: 0,
    code: ErrorCodes.UNKNOWN_ERROR,
    message: "An unexpected error occurred.",
  };
}
