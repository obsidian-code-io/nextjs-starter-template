import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Organization {
  id: string;
  name: string;
  code?: string;
  plan: string;
}

interface OrganizationState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  setOrganizations: (organizations: Organization[]) => void;
  setActiveOrganization: (organization: Organization | null) => void;
  addOrganization: (organization: Organization) => void;
  clearOrganizations: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organizations: [],
      activeOrganization: null,
      setOrganizations: (organizations) => set({ organizations }),
      setActiveOrganization: (organization) =>
        set({ activeOrganization: organization }),
      addOrganization: (organization) =>
        set((state) => ({
          organizations: [...state.organizations, organization],
        })),
      clearOrganizations: () =>
        set({ organizations: [], activeOrganization: null }),
    }),
    {
      name: "organization-storage",
    },
  ),
);
