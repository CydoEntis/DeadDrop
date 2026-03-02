import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/features/auth/services";
import { authKeys } from "@/features/auth/queries";
import { OAuthErrorCodes } from "@/features/auth/constants";

export interface OAuthCallbackParams {
  accessToken?: string;
  csrfToken?: string;
  error?: string;
  error_description?: string;
  linked?: string;
  provider?: string;
}

export function useOAuthCallback(params: OAuthCallbackParams) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    async function handleCallback() {
      const { accessToken, csrfToken, error: errorParam, error_description: errorDescription } = params;
      const linkedProvider = params.linked ?? params.provider;

      window.history.replaceState({}, "", window.location.pathname);

      if (linkedProvider) {
        queryClient.invalidateQueries({ queryKey: authKeys.linkedProviders });
        toast.success(`Successfully linked ${linkedProvider.charAt(0).toUpperCase() + linkedProvider.slice(1)}!`);
        navigate({ to: "/admin/droplink" });
        return;
      }

      if (errorParam) {
        switch (errorParam) {
          case OAuthErrorCodes.EMAIL_NOT_VERIFIED: {
            navigate({
              to: "/login",
              search: { error: "Please verify your email before signing in. Check your inbox for a verification link." },
            });
            return;
          }
          case OAuthErrorCodes.OAUTH_DENIED: {
            navigate({
              to: "/login",
              search: { error: "Authentication was cancelled." },
            });
            return;
          }
          case OAuthErrorCodes.PROVIDER_ALREADY_LINKED: {
            toast.error(errorDescription || "This provider is already linked to another account.");
            navigate({ to: "/admin/droplink" });
            return;
          }
        }

        navigate({
          to: "/login",
          search: { error: errorDescription || "OAuth authentication failed. Please try again." },
        });
        return;
      }

      if (!accessToken) {
        navigate({
          to: "/login",
          search: { error: "Authentication failed. Please try again." },
        });
        return;
      }

      try {
        if (csrfToken) {
          localStorage.setItem("csrfToken", csrfToken);
        }

        setAuth(
          {
            id: "",
            email: "",
            firstName: null,
            lastName: null,
            avatarUrl: null,
            roles: [],
            isEmailVerified: false,
            hasPassword: true,
          },
          accessToken,
        );

        const user = await authService.me();

        setAuth(user, accessToken);

        queryClient.invalidateQueries({ queryKey: authKeys.me });
        queryClient.invalidateQueries({ queryKey: authKeys.linkedProviders });

        toast.success("Successfully signed in!");

        await new Promise((resolve) => setTimeout(resolve, 100));

        navigate({ to: "/admin/droplink" });
      } catch (err) {
        console.error("Failed to complete OAuth flow:", err);
        toast.error("Failed to complete authentication");
        useAuthStore.getState().clearAuth();
        navigate({ to: "/login" });
      }
    }

    handleCallback();
  }, [navigate, queryClient, setAuth, params]);
}
