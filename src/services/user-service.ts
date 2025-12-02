import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/user-store";
import { useLoadingStore } from "@/store/loading-store";
import { handle401Unauthorized } from "@/lib/auth-utils-client";
import type { User } from "@/store/user-store";

const LOADING_KEY = "user-service";

async function fetchUser(
  skipRedirectOn401: boolean = false,
): Promise<User | null> {
  const response = await fetch("/api/user/me");
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (!skipRedirectOn401) {
        handle401Unauthorized();
      }
      return null;
    }
    throw new Error("Failed to fetch user");
  }
  const data = (await response.json()) as { user: User };
  return data.user;
}

export function useUser(forceRefetch: boolean = false) {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const { setLoading } = useLoadingStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      setLoading(LOADING_KEY, true);
      try {
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
          return userData;
        } else {
          // Not authenticated - clear store
          clearUser();
          return null;
        }
      } catch (error) {
        // If fetch fails, user is not authenticated - clear store
        clearUser();
        throw error;
      } finally {
        setLoading(LOADING_KEY, false);
      }
    },
    initialData: forceRefetch ? undefined : user || undefined, // Don't use initial data if forcing refetch
    enabled: forceRefetch || !user, // Fetch if forced or user not in store
    staleTime: forceRefetch ? 0 : 5 * 60 * 1000, // No stale time if forcing refetch
    refetchOnMount: forceRefetch ? "always" : true, // Always refetch on mount if forcing
    retry: false, // Don't retry on 401/403 errors
  });

  return query;
}

/**
 * Hook to check authentication status - always fetches to verify session
 * Use this for auth pages to check if user is already logged in
 */
export function useAuthStatus() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const { setLoading } = useLoadingStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user", "auth-check"],
    queryFn: async () => {
      setLoading(LOADING_KEY, true);
      try {
        // Skip redirect on 401 for auth pages (expected behavior)
        const userData = await fetchUser(true);
        if (userData) {
          setUser(userData);
          return userData;
        } else {
          // Not authenticated - clear store (but don't redirect, we're on auth page)
          clearUser();
          return null;
        }
      } catch (error) {
        // If fetch fails, user is not authenticated - clear store
        clearUser();
        return null;
      } finally {
        setLoading(LOADING_KEY, false);
      }
    },
    staleTime: 0, // Always check on mount
    retry: false, // Don't retry on 401/403 errors
  });

  return query;
}

export function useRefreshUser() {
  const { setUser } = useUserStore();
  const { setLoading } = useLoadingStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      setLoading(LOADING_KEY, true);
      try {
        const userData = await fetchUser();
        setUser(userData);
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        return userData;
      } finally {
        setLoading(LOADING_KEY, false);
      }
    },
  });
}
