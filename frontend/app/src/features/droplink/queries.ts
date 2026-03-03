import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { dropLinkService, dropLinkAdminService } from "./services";
import type { CreateDropRequest, CreateInviteCodeRequest } from "./types";

// Query key factories
export const dropLinkKeys = {
  all: ["droplink"] as const,
  drops: () => [...dropLinkKeys.all, "drops"] as const,
  drop: (publicId: string) => [...dropLinkKeys.drops(), publicId] as const,
};

export const dropLinkAdminKeys = {
  all: ["droplink-admin"] as const,
  invites: () => [...dropLinkAdminKeys.all, "invites"] as const,
  inviteList: (page: number, searchTerm?: string, status?: string, sortBy?: string) =>
    [...dropLinkAdminKeys.invites(), page, searchTerm, status, sortBy] as const,
  drops: () => [...dropLinkAdminKeys.all, "drops"] as const,
  dropList: (page: number, status?: string, searchTerm?: string) =>
    [...dropLinkAdminKeys.drops(), page, status, searchTerm] as const,
  stats: () => [...dropLinkAdminKeys.all, "stats"] as const,
};

// Public hooks
export function useVerifyInvite() {
  return useMutation({
    mutationFn: (code: string) => dropLinkService.verifyInvite(code),
  });
}

export function useCreateDrop() {
  return useMutation({
    mutationFn: (request: CreateDropRequest) =>
      dropLinkService.createDrop(request),
  });
}

export function useDropMetadata(publicId: string) {
  return useQuery({
    queryKey: dropLinkKeys.drop(publicId),
    queryFn: () => dropLinkService.getDropMetadata(publicId),
    enabled: !!publicId,
    retry: false,
  });
}

export function useAuthorizeDownload() {
  return useMutation({
    mutationFn: ({
      publicId,
      password,
    }: {
      publicId: string;
      password?: string;
    }) => dropLinkService.authorizeDownload(publicId, password),
  });
}

// Admin hooks
export function useCreateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateInviteCodeRequest) =>
      dropLinkAdminService.createInviteCode(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dropLinkAdminKeys.invites(),
      });
      queryClient.invalidateQueries({ queryKey: dropLinkAdminKeys.stats() });
    },
  });
}

export function useAdminInviteCodes(page = 1, pageSize = 20, searchTerm?: string, status?: string, sortBy?: string) {
  return useQuery({
    queryKey: dropLinkAdminKeys.inviteList(page, searchTerm, status, sortBy),
    queryFn: () => dropLinkAdminService.listInviteCodes(page, pageSize, searchTerm, status, sortBy),
    placeholderData: keepPreviousData,
  });
}

export function useRevokeInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dropLinkAdminService.revokeInviteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dropLinkAdminKeys.invites(),
      });
    },
  });
}

export function useDeleteInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dropLinkAdminService.deleteInviteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dropLinkAdminKeys.invites(),
      });
      queryClient.invalidateQueries({ queryKey: dropLinkAdminKeys.stats() });
    },
  });
}

export function useDropLinkStats() {
  return useQuery({
    queryKey: dropLinkAdminKeys.stats(),
    queryFn: () => dropLinkAdminService.getStats(),
  });
}

export function useDeleteDrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dropLinkAdminService.deleteDrop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dropLinkAdminKeys.drops() });
      queryClient.invalidateQueries({ queryKey: dropLinkAdminKeys.stats() });
    },
  });
}

export function useAdminDrops(page = 1, pageSize = 20, status?: string, searchTerm?: string) {
  return useQuery({
    queryKey: dropLinkAdminKeys.dropList(page, status, searchTerm),
    queryFn: () => dropLinkAdminService.listDrops(page, pageSize, status, searchTerm),
    placeholderData: keepPreviousData,
  });
}
