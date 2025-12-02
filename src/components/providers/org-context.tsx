"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useOrganizations,
  useCreateOrganization,
} from "@/services/organization-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Organization {
  id: string;
  code?: string;
  name: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const router = useRouter();

  const { data: organizations, isLoading } = useOrganizations();
  const createOrganizationMutation = useCreateOrganization();

  useEffect(() => {
    if (
      !isLoading &&
      organizations &&
      organizations.length === 0 &&
      !organization
    ) {
      // Show dialog if no organizations are available
      setShowCreateDialog(true);
    } else if (organizations && organizations.length > 0) {
      // Close dialog if organizations are available
      if (showCreateDialog) {
        setShowCreateDialog(false);
      }

      if (!organization) {
        // Check if there's a stored org in local storage and if it's valid
        const storedOrgStr = localStorage.getItem("currentOrganization");
        if (storedOrgStr) {
          const storedOrg = JSON.parse(storedOrgStr);
          const isValid = organizations.find(
            (o: Organization) => o.id === storedOrg.id,
          );
          if (isValid) {
            setOrganization(isValid);
            return;
          }
        }

        // Default to the first organization
        setOrganization(organizations[0]);
        localStorage.setItem(
          "currentOrganization",
          JSON.stringify(organizations[0]),
        );
      }
    }
  }, [organizations, organization, isLoading, showCreateDialog]);

  const handleSetOrganization = (org: Organization) => {
    setOrganization(org);
    localStorage.setItem("currentOrganization", JSON.stringify(org));
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      return;
    }
    try {
      const newOrg = await createOrganizationMutation.mutateAsync(
        newOrgName.trim(),
      );
      setOrganization(newOrg);
      localStorage.setItem("currentOrganization", JSON.stringify(newOrg));
      setShowCreateDialog(false);
      setNewOrgName("");
      router.refresh();
    } catch (error) {
      console.error("Failed to create organization", error);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        setOrganization: handleSetOrganization,
        isLoading,
      }}
    >
      {children}
      <Dialog open={showCreateDialog} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[425px] [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Create Your First Organization</DialogTitle>
            <DialogDescription>
              You need to create an organization to get started. This will be
              your first step in managing your inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrganization}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orgName" className="text-right">
                  Name
                </Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="col-span-3"
                  placeholder="My Organization"
                  required
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  createOrganizationMutation.isPending || !newOrgName.trim()
                }
              >
                {createOrganizationMutation.isPending
                  ? "Creating..."
                  : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}
