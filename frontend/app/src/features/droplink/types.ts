export interface InviteLimits {
  maxBytesPerDrop: number | null;
  maxTtlSeconds: number | null;
  defaultTtlSeconds: number | null;
  remainingBytes: number | null;
  remainingDrops: number | null;
}

export interface InviteVerifyResponse {
  label: string;
  limits: InviteLimits;
}

export interface CreateDropRequest {
  inviteCode: string;
  ttlSeconds: number;
  password?: string;
  deleteAfterDownloads: number;
  originalFilename: string;
  contentType?: string;
}

export interface CreateDropResponse {
  publicId: string;
  dropId: string;
  expiresAt: string;
  upload: {
    protocol: string;
    endpoint: string;
  };
}

export interface DropMetadataResponse {
  publicId: string;
  status: string;
  originalFilename: string;
  sizeBytes: number | null;
  expiresAt: string;
  requiresPassword: boolean;
  downloadCount: number;
  deleteAfterDownloads: number;
}

export interface DownloadAuthResponse {
  token: string;
  expiresInSeconds: number;
}

// Admin types
export interface InviteCodeResponse {
  id: string;
  code: string;
  label: string;
  createdAt: string;
  expiresAt: string | null;
  isRevoked: boolean;
  maxTotalBytes: number | null;
  maxDropCount: number | null;
  maxBytesPerDrop: number | null;
  defaultTtlSeconds: number | null;
  maxTtlSeconds: number | null;
  usedTotalBytes: number;
  usedDropCount: number;
  lastUsedAt: string | null;
}

export interface CreateInviteCodeRequest {
  label: string;
  maxTotalBytes?: number;
}

export interface CreateInviteCodeResponse {
  inviteCode: string;
  id: string;
}

export interface AdminDropResponse {
  id: string;
  publicId: string;
  status: string;
  originalFilename: string;
  sizeBytes: number | null;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  deleteAfterDownloads: number;
  inviteCodeLabel: string;
}

export interface DropLinkStatsResponse {
  totalStorageUsedBytes: number;
  activeDropsCount: number;
  totalDownloads24h: number;
  totalDownloads7d: number;
  totalDownloads30d: number;
  totalBytesTransferred: number;
  activeInviteCodesCount: number;
  totalInviteCodesCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
