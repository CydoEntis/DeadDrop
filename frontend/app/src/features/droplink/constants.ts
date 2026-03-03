export const DEFAULT_TTL_SECONDS = 604800; // 7 days

export const DROP_STATUS = {
  CREATED: "Created",
  UPLOADING: "Uploading",
  READY: "Ready",
  DELETING: "Deleting",
  DELETED: "Deleted",
  EXPIRED: "Expired",
  FAILED: "Failed",
} as const;
