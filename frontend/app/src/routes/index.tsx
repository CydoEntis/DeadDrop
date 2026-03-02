import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { LandingShowcase } from "@/features/landing/LandingShowcase";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: "/admin/droplink" });
    }
  },
  component: LandingShowcase,
});
