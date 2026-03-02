export const TTL_OPTIONS = [
  { label: "15 minutes", value: 900 },
  { label: "1 hour", value: 3600 },
  { label: "1 day", value: 86400 },
  { label: "1 week", value: 604800 },
  { label: "1 month", value: 2592000 },
] as const;

export const DELETE_AFTER_OPTIONS = [
  { label: "1 download", value: 1 },
  { label: "2 downloads", value: 2 },
  { label: "3 downloads", value: 3 },
  { label: "5 downloads", value: 5 },
  { label: "Unlimited", value: 0 },
] as const;

export const DROP_STATUS = {
  CREATED: "Created",
  UPLOADING: "Uploading",
  READY: "Ready",
  DELETING: "Deleting",
  DELETED: "Deleted",
  EXPIRED: "Expired",
  FAILED: "Failed",
} as const;
