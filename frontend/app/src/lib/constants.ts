export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  DISCORD: "discord",
  GITHUB: "github",
} as const;

export const OAUTH_PROVIDER_NAMES: Record<string, string> = {
  [OAUTH_PROVIDERS.GOOGLE]: "Google",
  [OAUTH_PROVIDERS.DISCORD]: "Discord",
  [OAUTH_PROVIDERS.GITHUB]: "GitHub",
};

export const SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

export const SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdat",
  EMAIL: "email",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  IS_LOCKED: "isLocked",
  IS_EMAIL_VERIFIED: "isEmailVerified",
} as const;

export const FILTER_ALL = "all" as const;

export const USER_STATUS_FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  LOCKED: "locked",
} as const;

export const USER_VERIFIED_FILTERS = {
  ALL: "all",
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
} as const;

export const USER_ROLES = {
  ADMIN: "Admin",
  USER: "User",
} as const;
