"use client";

import NextTopLoader from "nextjs-toploader";

/**
 * Provider component for Next.js Top Loader
 * Shows loading bar during navigation and data fetching
 * Automatically shows on route changes and page transitions
 */
export function TopLoaderProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#000000"
        height={3}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px rgba(0,0,0,0.5)"
        zIndex={9999}
        crawl={true}
        crawlSpeed={200}
        initialPosition={0.08}
        showAtBottom={false}
      />
      {children}
    </>
  );
}
