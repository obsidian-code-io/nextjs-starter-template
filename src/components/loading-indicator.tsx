"use client";

import { useLoadingStore } from "@/store/loading-store";
import { useMemo } from "react";

interface LoadingIndicatorProps {
  keys?: string[];
  show?: boolean;
}

/**
 * Singleton Loading Hook
 * Returns true if any of the specified services are loading, false otherwise
 */
export function useLoadingState(keys: string[]): boolean {
  const loadingItems = useLoadingStore((state) => state.loadingItems);

  return useMemo(() => {
    return keys.some((key) => loadingItems.has(key));
  }, [keys, loadingItems]);
}

/**
 * Global Loading Indicator Component
 * Displays a loading indicator when any service is loading
 */
export function GlobalLoadingIndicator({
  keys,
  show = true,
}: LoadingIndicatorProps) {
  const loadingItems = useLoadingStore((state) => state.loadingItems);

  const isLoading = useMemo(() => {
    if (keys) {
      return keys.some((key) => loadingItems.has(key));
    }
    return loadingItems.size > 0;
  }, [loadingItems, keys]);

  if (!show || !isLoading) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary animate-pulse"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

/**
 * Hook to check if a specific service is loading
 */
export function useIsServiceLoading(key: string): boolean {
  const loadingItems = useLoadingStore((state) => state.loadingItems);
  return loadingItems.has(key);
}
