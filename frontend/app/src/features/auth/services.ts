import apiClient from "@/lib/api-client";
import type { User } from "@/stores/auth.store";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshResponse,
  ChangePasswordRequest,
  SetPasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ChangeEmailRequest,
  VerifyEmailChangeRequest,
  LinkedProvider,
  LinkProviderResponse,
} from "./types";
interface SessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

const prefix = "/api/auth";

export const authService = {
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post(`${prefix}/register`, data);
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post(`${prefix}/login`, data);
    return response.data.data;
  },

  async refresh(): Promise<RefreshResponse> {
    const response = await apiClient.post(`${prefix}/refresh`, {});
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post(`${prefix}/logout`, {});
  },

  async me(): Promise<User> {
    const response = await apiClient.get(`${prefix}/me`);
    return response.data.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post(`${prefix}/change-password`, data);
  },

  async setPassword(data: SetPasswordRequest): Promise<void> {
    await apiClient.post(`${prefix}/set-password`, data);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post(`${prefix}/forgot-password`, data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post(`${prefix}/reset-password`, data);
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    await apiClient.post(`${prefix}/verify-email`, data);
  },

  async changeEmail(data: ChangeEmailRequest): Promise<void> {
    await apiClient.post(`${prefix}/change-email`, data);
  },

  async verifyEmailChange(data: VerifyEmailChangeRequest): Promise<void> {
    await apiClient.get(`${prefix}/verify-email-change`, { params: { token: data.token } });
  },

  async getSessions(): Promise<SessionInfo[]> {
    const response = await apiClient.get(`${prefix}/sessions`);
    return response.data.data;
  },

  async revokeOtherSessions(): Promise<void> {
    await apiClient.post(`${prefix}/sessions/revoke-others`, {});
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.post(`${prefix}/sessions/revoke`, { sessionId });
  },

  async getLinkedProviders(): Promise<LinkedProvider[]> {
    const response = await apiClient.get(`${prefix}/oauth/linked`);
    const providers = response.data.providers ?? response.data.data ?? [];
    return providers.map(
      (p: {
        provider: string;
        providerId?: string;
        email?: string;
        providerEmail?: string;
        username?: string;
        providerUsername?: string;
        linkedAt: string;
      }) => ({
        provider: p.provider,
        providerId: p.providerId ?? "",
        providerEmail: p.providerEmail ?? p.email ?? null,
        providerUsername: p.providerUsername ?? p.username ?? null,
        linkedAt: p.linkedAt,
      }),
    );
  },

  async linkProvider(provider: string): Promise<LinkProviderResponse> {
    const response = await apiClient.post(`${prefix}/oauth/${provider}/link`, {});
    const data = response.data.data ?? response.data;
    return {
      authUrl: data.authUrl ?? data.AuthUrl ?? data,
    };
  },

  async unlinkProvider(provider: string): Promise<void> {
    await apiClient.delete(`${prefix}/oauth/${provider}/unlink`);
  },
};
