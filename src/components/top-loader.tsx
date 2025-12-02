"use client";

import NextTopLoader from "nextjs-toploader";

export function TopLoader() {
  return (
    <NextTopLoader
      color="#ff0000"
      height={3}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px #ff0000, 0 0 5px #ff0000"
      zIndex={9999}
      crawl={true}
      crawlSpeed={200}
      initialPosition={0.08}
      showAtBottom={false}
    />
  );
}
