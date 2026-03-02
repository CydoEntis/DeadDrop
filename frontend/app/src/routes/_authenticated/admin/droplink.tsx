import { createFileRoute } from "@tanstack/react-router";
import { DropLinkAdminPage } from "@/features/droplink/components/admin/DropLinkAdminPage";

export const Route = createFileRoute("/_authenticated/admin/droplink")({
  component: DropLinkAdminPage,
});
