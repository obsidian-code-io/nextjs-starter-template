"use client";

import { useOrganization } from "@/components/providers/org-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withOrganization<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function WithOrganization(props: P) {
    const { organization, isLoading } = useOrganization();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !organization) {
        router.push("/select-org"); // Redirect to org selection if no org is selected
      }
    }, [organization, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      );
    }

    if (!organization) {
      return null; // Will redirect
    }

    return <Component {...props} />;
  };
}
