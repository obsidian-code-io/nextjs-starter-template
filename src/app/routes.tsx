"use client";

import {
  LayoutDashboard,
  LucideIcon,
  Settings2,
  User,
  Bot,
  Database,
} from "lucide-react";
interface RouteHeader {
  title: string;
  description: string;
}
export interface Route {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon;
    header?: RouteHeader;
  }[];
  header?: RouteHeader;
}

export const routes: Route[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    header: {
      title: "Dashboard",
      description: "Welcome to your dashboard",
    },
  },
  {
    title: "Agents",
    url: "/dashboard/agents",
    icon: Bot,
    header: {
      title: "Agents",
      description: "Create and manage AI agents",
    },
  },
  {
    title: "Knowledge Base",
    url: "/dashboard/knowledge-base",
    icon: Database,
    header: {
      title: "Knowledge Base",
      description: "Train your knowledge base with files and websites",
    },
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
    header: {
      title: "Profile",
      description: "Manage your profile settings",
    },
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2,
    header: {
      title: "Settings",
      description: "Manage your organization settings",
    },
  },
];

export function getRouteHeader(link: string) {
  return routes.find((route) => route.url === link)?.header ?? null;
}
