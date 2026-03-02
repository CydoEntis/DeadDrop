import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "./services";
import { authKeys } from "./queries";

export function useLinkedProviders() {
  return useQuery({
    queryKey: authKeys.linkedProviders,
    queryFn: () => authService.getLinkedProviders(),
  });
}

export function useLinkProvider() {
  return useMutation({
    mutationFn: (provider: string) => authService.linkProvider(provider),
    onSuccess: (response) => {
      window.location.href = response.authUrl;
    },
  });
}

export function useUnlinkProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) => authService.unlinkProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.linkedProviders });
    },
  });
}
