import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "./services";
import { useAuthStore } from "@/stores/auth.store";
import type { LoginRequest } from "./types";

export const authKeys = {
  me: ["auth", "me"] as const,
  linkedProviders: ["auth", "linkedProviders"] as const,
};

export function useMe() {
  const { setUser, accessToken, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await authService.me();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated && !!accessToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogin(redirectTo?: string) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (response) => {
      try {
        setAuth({ id: "", email: "", firstName: null, lastName: null, avatarUrl: null, roles: [], isEmailVerified: false, hasPassword: true }, response.accessToken);

        const user = await authService.me();

        setAuth(user, response.accessToken);
        queryClient.invalidateQueries({ queryKey: authKeys.me });
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate({ to: redirectTo || "/admin/droplink" });
      } catch (error) {
        console.error("Failed to fetch user after login:", error);
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        throw error;
      }
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      window.location.href = "/login";
    },
    onError: () => {
      clearAuth();
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}
