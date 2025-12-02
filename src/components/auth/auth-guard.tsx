"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import { useAuthStatus } from "@/services/user-service";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component that prevents auth pages from showing if user is already authenticated
 * Checks persisted store first (synchronous) to prevent flash
 * Uses ref to prevent race conditions with multiple redirects
 */
export function AuthGuard({
  children,
  redirectTo = "/dashboard",
}: AuthGuardProps) {
  const router = useRouter();
  const {
    isAuthenticated: authStoreAuthenticated,
    user: authStoreUser,
    login: setAuthLogin,
    logout: setAuthLogout,
  } = useAuthStore();
  const { user: storeUser } = useUserStore();
  const [shouldRender, setShouldRender] = useState(false);
  const redirectInitiated = useRef(false);
  const authCheckComplete = useRef(false);

  // Check API to verify session
  const { data: user, isLoading, isFetching, isError } = useAuthStatus();

  // Check persisted store synchronously first
  const hasPersistedAuth =
    authStoreAuthenticated || !!storeUser || !!authStoreUser;

  // Single consolidated effect to handle all redirect logic - prevents race conditions
  useEffect(() => {
    // Prevent multiple redirects
    if (redirectInitiated.current) return;

    // Case 1: If we have persisted auth, redirect immediately (before API check completes)
    if (hasPersistedAuth && !authCheckComplete.current) {
      redirectInitiated.current = true;
      router.replace(redirectTo);
      return;
    }

    // Case 2: Wait for API check to complete
    const isCheckComplete = !isLoading && !isFetching;

    if (isCheckComplete && !authCheckComplete.current) {
      authCheckComplete.current = true;

      if (user) {
        // User is authenticated via API - sync with auth store and redirect
        if (!redirectInitiated.current) {
          redirectInitiated.current = true;
          setAuthLogin({
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: "USER",
          });
          router.replace(redirectTo);
        }
      } else {
        // User is not authenticated - clear auth store and allow render
        // Note: handle401Unauthorized might have already been called by fetchUser
        // but we still need to clear local state
        setAuthLogout();
        setShouldRender(true);
      }
    }
  }, [
    hasPersistedAuth,
    user,
    isLoading,
    isFetching,
    isError,
    redirectTo,
    router,
    setAuthLogin,
    setAuthLogout,
  ]);

  // Don't render if we have persisted auth (prevent flash)
  // Show loading until we've checked persisted auth
  if (hasPersistedAuth && !authCheckComplete.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking (only if no persisted auth)
  if ((isLoading || isFetching || !shouldRender) && !hasPersistedAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-gray-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
