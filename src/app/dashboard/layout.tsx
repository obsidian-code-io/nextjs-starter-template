"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { withAuth } from "@/components/auth/with-auth";
import { OrganizationProvider } from "@/components/providers/org-context";
import { QueryProvider } from "@/components/providers/query-provider";
import { GlobalLoadingIndicator } from "@/components/loading-indicator";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HeaderTitle } from "@/components/header-title";

export const dynamic = "force-dynamic";
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <OrganizationProvider>
        <GlobalLoadingIndicator />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <HeaderTitle />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </OrganizationProvider>
    </QueryProvider>
  );
}
export default withAuth(DashboardLayout);
