"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStatus } from "@/services/user-service";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

/**
 * Hook to check authentication status on mount/hard refresh
 * Redirects authenticated users away from auth pages
 * Shows loading state while checking
 */
export function useAuthCheck(redirectIfAuthenticated: boolean = true) {
  const router = useRouter();
  const {
    login: setAuthLogin,
    logout: setAuthLogout,
    isAuthenticated: authStoreAuthenticated,
    user: authStoreUser,
  } = useAuthStore();
  const { user: storeUser } = useUserStore();
  const [hasChecked, setHasChecked] = useState(false);

  // Always fetch to verify session is still valid (for hard refresh)
  const { data: user, isLoading, isFetching } = useAuthStatus();

  // Check persisted store synchronously first
  const persistedUser = useMemo(() => {
    return (
      storeUser ||
      (authStoreUser
        ? {
            id: authStoreUser.id,
            email: authStoreUser.email,
            name: authStoreUser.name || null,
          }
        : null)
    );
  }, [storeUser, authStoreUser]);

  // Immediate redirect if user is in persisted store
  useEffect(() => {
    if (persistedUser && redirectIfAuthenticated && !hasChecked) {
      router.replace("/dashboard");
      setHasChecked(true);
    }
  }, [persistedUser, redirectIfAuthenticated, hasChecked, router]);

  // After API check completes, handle redirect and sync
  useEffect(() => {
    if (!isLoading && !isFetching) {
      setHasChecked(true);
      const currentUser = user || persistedUser;

      if (currentUser) {
        // User is authenticated - sync with auth store
        setAuthLogin({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name || undefined,
          role: "USER", // Default role, update if you have roles
        });

        // Redirect if on auth page
        if (redirectIfAuthenticated) {
          router.replace("/dashboard");
        }
      } else {
        // Not authenticated - clear auth store
        setAuthLogout();
      }
    }
  }, [
    user,
    persistedUser,
    isLoading,
    isFetching,
    redirectIfAuthenticated,
    router,
    setAuthLogin,
    setAuthLogout,
  ]);

  // Show loading if:
  // 1. Query is loading or fetching
  // 2. Haven't completed check yet
  // 3. User appears authenticated and we're about to redirect (prevent flash)
  const shouldShowLoading =
    isLoading ||
    isFetching ||
    !hasChecked ||
    (redirectIfAuthenticated && (!!user || !!persistedUser));

  return {
    isAuthenticated: !!user || !!persistedUser,
    isLoading: shouldShowLoading,
    user: user || persistedUser,
  };
}
