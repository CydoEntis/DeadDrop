import { Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export interface NavConfig {
  header: {
    title: string;
    logo: string;
    url: string;
  };
  main: NavItem[];
  admin: NavItem[];
  footer: NavItem[];
}

export const nav: NavConfig = {
  header: {
    title: "DeadDrop",
    logo: "📦",
    url: "/admin/droplink",
  },

  main: [],

  admin: [
    {
      title: "DropLink",
      url: "/admin/droplink",
      icon: Share2,
    },
  ],

  footer: [],
};
