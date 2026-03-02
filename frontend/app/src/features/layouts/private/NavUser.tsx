import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";

export function NavUser() {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  const displayName = user.firstName || user.email.split("@")[0] || "User";

  const getInitials = () => {
    const first = user.firstName?.trim() || "";
    const last = user.lastName?.trim() || "";

    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase();
    } else if (first) {
      return first.substring(0, 2).toUpperCase();
    } else if (last) {
      return last.substring(0, 2).toUpperCase();
    }

    return user.email[0]?.toUpperCase() || "U";
  };

  const userInitials = getInitials();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="rounded-lg font-semibold">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
