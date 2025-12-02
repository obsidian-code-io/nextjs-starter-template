import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganizationStore } from "@/store/organization-store";
import { useLoadingStore } from "@/store/loading-store";
import { handle401Unauthorized } from "@/lib/auth-utils-client";
import type { Organization } from "@/store/organization-store";

const LOADING_KEY = "organization-service";

async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetch("/api/organizations");
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Handle 401 - clear storage and redirect
      handle401Unauthorized();
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch organizations");
  }
  const data = (await response.json()) as {
    organizations: Organization[];
  };
  return data.organizations;
}

async function createOrganization(name: string): Promise<Organization> {
  const response = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Handle 401 - clear storage and redirect
      handle401Unauthorized();
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to create organization");
  }
  const data = (await response.json()) as {
    organization: Organization;
  };
  return data.organization;
}

export function useOrganizations() {
  const organizations = useOrganizationStore((state) => state.organizations);
  const setOrganizations = useOrganizationStore(
    (state) => state.setOrganizations,
  );
  const { setLoading } = useLoadingStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      setLoading(LOADING_KEY, true);
      try {
        const orgs = await fetchOrganizations();
        setOrganizations(orgs);
        return orgs;
      } finally {
        setLoading(LOADING_KEY, false);
      }
    },
    initialData: organizations.length > 0 ? organizations : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
}

export function useCreateOrganization() {
  const { addOrganization, setActiveOrganization } = useOrganizationStore();
  const { setLoading } = useLoadingStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      setLoading(LOADING_KEY, true);
      try {
        const newOrg = await createOrganization(name);
        addOrganization(newOrg);
        setActiveOrganization(newOrg);
        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
        return newOrg;
      } finally {
        setLoading(LOADING_KEY, false);
      }
    },
  });
}

export function useRefreshOrganizations() {
  const { setOrganizations } = useOrganizationStore();
  const { setLoading } = useLoadingStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      setLoading(LOADING_KEY, true);
      try {
        const orgs = await fetchOrganizations();
        setOrganizations(orgs);
        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
        return orgs;
      } finally {
        setLoading(LOADING_KEY, false);
      }
    },
  });
}
