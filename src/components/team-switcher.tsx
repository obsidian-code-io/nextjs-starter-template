"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  useOrganizations,
  useCreateOrganization,
} from "@/services/organization-service";
import {
  useOrganizationStore,
  type Organization,
} from "@/store/organization-store";

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: organizations, isLoading } = useOrganizations();
  const createOrganizationMutation = useCreateOrganization();
  const {
    activeOrganization,
    setActiveOrganization,
    organizations: storeOrganizations,
  } = useOrganizationStore();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newOrgName, setNewOrgName] = React.useState("");

  // Use query data if available, otherwise fall back to store
  const teams = organizations || storeOrganizations;

  // Initialize active organization from cookie on mount
  React.useEffect(() => {
    if (teams && teams.length > 0 && !activeOrganization) {
      const cookies = document.cookie.split("; ").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.split("=");
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>,
      );

      const savedOrgId = cookies["organizationId"];
      if (savedOrgId) {
        const savedOrg = teams.find((org) => org.id === savedOrgId);
        if (savedOrg) {
          setActiveOrganization(savedOrg);
        } else {
          setActiveOrganization(teams[0]);
          document.cookie = `organizationId=${teams[0].id}; path=/; max-age=${
            7 * 24 * 60 * 60
          }`;
        }
      } else {
        setActiveOrganization(teams[0]);
        document.cookie = `organizationId=${teams[0].id}; path=/; max-age=${
          7 * 24 * 60 * 60
        }`;
      }
    } else if (teams && teams.length === 0) {
      setIsDialogOpen(true);
    }
  }, [teams, activeOrganization, setActiveOrganization]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newOrg = await createOrganizationMutation.mutateAsync(newOrgName);
      document.cookie = `organizationId=${newOrg.id}; path=/; max-age=${
        7 * 24 * 60 * 60
      }`;
      setIsDialogOpen(false);
      setNewOrgName("");
      router.refresh();
    } catch (error) {
      console.error("Failed to create organization", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading organizations...
      </div>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeOrganization && <Building2 className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization?.name || "Select Organization"}
                </span>
                <span className="truncate text-xs">
                  {activeOrganization?.plan || "No Plan"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organization
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => {
                  document.cookie = `organizationId=${
                    team.id
                  }; path=/; max-age=${7 * 24 * 60 * 60}`;
                  setActiveOrganization(team);
                  router.refresh();
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add Organization
                  </div>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization to manage your inventory.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateOrganization}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="col-span-3"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createOrganizationMutation.isPending}
                    >
                      {createOrganizationMutation.isPending
                        ? "Creating..."
                        : "Create Organization"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
