"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/services/user-service";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireAuth: boolean = true,
) {
  return function WithAuth(props: P) {
    const router = useRouter();
    const { isAuthenticated: authStoreAuthenticated, login: setAuthLogin } =
      useAuthStore();
    const { user: storeUser } = useUserStore();

    // Always fetch user to verify session (session cookie is source of truth)
    // This ensures we check auth even after fresh login when store might be empty
    const { data: user, isLoading, isError } = useUser(true);

    // Check if user is authenticated (from store or query)
    const isAuthenticated = !!user || !!storeUser || authStoreAuthenticated;

    // Sync auth store with user data
    useEffect(() => {
      const currentUser = user || storeUser;
      if (currentUser && !authStoreAuthenticated) {
        setAuthLogin({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name || undefined,
          role: "USER",
        });
      }
    }, [user, storeUser, authStoreAuthenticated, setAuthLogin]);

    useEffect(() => {
      // Don't redirect while loading
      if (isLoading) return;

      if (requireAuth && !isAuthenticated && !isLoading) {
        console.log("Redirecting to /login - not authenticated");
        router.replace("/login");
      } else if (!requireAuth && isAuthenticated && !isLoading) {
        console.log("Redirecting to /dashboard - already authenticated");
        router.replace("/dashboard");
      }
    }, [isAuthenticated, isLoading, requireAuth, router]);

    // Show loading while checking authentication
    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Don't render if redirecting
    if (requireAuth && !isAuthenticated) return null;
    if (!requireAuth && isAuthenticated) return null;

    return <WrappedComponent {...props} />;
  };
}
