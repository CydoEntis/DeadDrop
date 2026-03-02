import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useOAuthCallback } from "@/features/auth/hooks/useOAuthCallback";
import { oauthCallbackSearchSchema } from "@/features/auth/schemas";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
  validateSearch: oauthCallbackSearchSchema,
});

function AuthCallbackPage() {
  const searchParams = Route.useSearch();
  useOAuthCallback(searchParams);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
