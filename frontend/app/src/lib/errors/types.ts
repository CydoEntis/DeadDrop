export type ErrorHoundClientError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  meta?: {
    timestamp?: string;
    version?: string;
  };
};
