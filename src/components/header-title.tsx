"use client";

import { getRouteHeader } from "@/app/routes";
import { usePathname } from "next/navigation";
export function HeaderTitle() {
  const pathname = usePathname();
  const header = getRouteHeader(pathname);
  return header ? (
    <div>
      <h1 className="text-xl font-bold">{header.title}</h1>
      <p className="text-sm text-muted-foreground">{header.description}</p>
    </div>
  ) : null;
}
