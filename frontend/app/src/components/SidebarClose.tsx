import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarClose() {
  const { toggleSidebar, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
      <X className="h-5 w-5" />
      <span className="sr-only">Close menu</span>
    </Button>
  );
}
