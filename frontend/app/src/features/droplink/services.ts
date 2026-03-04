import apiClient from "@/lib/api-client";
import type {
  InviteVerifyResponse,
  CreateDropRequest,
  CreateDropResponse,
  DropMetadataResponse,
  DownloadAuthResponse,
  InviteCodeResponse,
  CreateInviteCodeRequest,
  CreateInviteCodeResponse,
  AdminDropResponse,
  DropLinkStatsResponse,
  PaginatedResponse,
  InitiateUploadResponse,
  PresignPartsResponse,
} from "./types";

const prefix = "/api/droplink";
const adminPrefix = "/api/droplink/admin";

export const dropLinkService = {
  async verifyInvite(code: string): Promise<InviteVerifyResponse> {
    const response = await apiClient.post(`${prefix}/invites/verify`, {
      code,
    });
    return response.data.data ?? response.data;
  },

  async createDrop(request: CreateDropRequest): Promise<CreateDropResponse> {
    const response = await apiClient.post(`${prefix}/drops`, request);
    return response.data.data ?? response.data;
  },

  async getDropMetadata(publicId: string): Promise<DropMetadataResponse> {
    const response = await apiClient.get(`${prefix}/drops/${publicId}`);
    return response.data.data ?? response.data;
  },

  async authorizeDownload(
    publicId: string,
    password?: string
  ): Promise<DownloadAuthResponse> {
    const response = await apiClient.post(`${prefix}/drops/auth`, {
      publicId,
      password: password ?? null,
    });
    return response.data.data ?? response.data;
  },

  getDownloadUrl(publicId: string, token: string): string {
    const baseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5135";
    return `${baseUrl}${prefix}/drops/${publicId}/download?token=${encodeURIComponent(token)}`;
  },

  async initiateUpload(dropId: string): Promise<InitiateUploadResponse> {
    const response = await apiClient.post(`${prefix}/drops/${dropId}/upload/init`);
    return response.data.data ?? response.data;
  },

  async presignParts(dropId: string, uploadId: string, partNumbers: number[]): Promise<PresignPartsResponse> {
    const response = await apiClient.post(`${prefix}/drops/${dropId}/upload/presign`, {
      uploadId,
      partNumbers,
    });
    return response.data.data ?? response.data;
  },

  async completeUpload(dropId: string, uploadId: string, parts: { partNumber: number; eTag: string }[]): Promise<void> {
    await apiClient.post(`${prefix}/drops/${dropId}/upload/complete`, {
      uploadId,
      parts,
    });
  },

  async abortUpload(dropId: string, uploadId: string): Promise<void> {
    await apiClient.post(`${prefix}/drops/${dropId}/upload/abort`, {
      uploadId,
    });
  },
};

export const dropLinkAdminService = {
  async createInviteCode(
    request: CreateInviteCodeRequest
  ): Promise<CreateInviteCodeResponse> {
    const response = await apiClient.post(`${adminPrefix}/invites`, request);
    return response.data.data ?? response.data;
  },

  async listInviteCodes(
    page = 1,
    pageSize = 20,
    searchTerm?: string,
    status?: string,
    sortBy?: string
  ): Promise<PaginatedResponse<InviteCodeResponse>> {
    let url = `${adminPrefix}/invites?page=${page}&pageSize=${pageSize}`;
    if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
    const response = await apiClient.get(url);
    const data = response.data.data ?? response.data;
    return {
      data: data.data ?? data,
      meta: data.meta ?? response.data.meta,
    };
  },

  async revokeInviteCode(id: string): Promise<void> {
    await apiClient.post(`${adminPrefix}/invites/${id}/revoke`);
  },

  async deleteInviteCode(id: string): Promise<void> {
    await apiClient.delete(`${adminPrefix}/invites/${id}`);
  },

  async getStats(): Promise<DropLinkStatsResponse> {
    const response = await apiClient.get(`${adminPrefix}/stats`);
    return response.data.data ?? response.data;
  },

  async deleteDrop(id: string): Promise<void> {
    await apiClient.delete(`${adminPrefix}/drops/${id}`);
  },

  async listDrops(
    page = 1,
    pageSize = 20,
    status?: string,
    searchTerm?: string
  ): Promise<PaginatedResponse<AdminDropResponse>> {
    let url = `${adminPrefix}/drops?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    const response = await apiClient.get(url);
    const data = response.data.data ?? response.data;
    return {
      data: data.data ?? data,
      meta: data.meta ?? response.data.meta,
    };
  },
};
