import * as React from "react";
import { Link } from "@tanstack/react-router";

import { NavMain } from "@/features/layouts/private/NavMain";
import { NavAdmin } from "@/features/layouts/private/NavAdmin";
import { PrivateNavFooter } from "@/features/layouts/private/NavFooter";
import { NavUser } from "@/features/layouts/private/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { nav } from "@/features/layouts/private/config";
import { AppLogo } from "@/components/AppLogo";
import { SidebarClose } from "@/components/SidebarClose";
import { useAuthStore } from "@/stores/auth.store";

export function PrivateAppShell({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const { setOpenMobile } = useSidebar();
  const isAdmin = user?.roles.includes("Admin") ?? false;

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarClose />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={nav.header.url} onClick={() => setOpenMobile(false)}>
                <div className="flex items-center justify-center">
                  <AppLogo className="h-8 w-auto" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{nav.header.title}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav.main} />
        {isAdmin && <NavAdmin items={nav.admin} />}
        <PrivateNavFooter className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
