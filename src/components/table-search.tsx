"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TableSearchProps extends React.ComponentProps<typeof Input> {
  paramKey?: string;
  debounceMs?: number;
}

export function TableSearch({
  paramKey = "q",
  debounceMs = 350,
  className,
  ...props
}: TableSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get(paramKey) ?? "");
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setValue(searchParams.get(paramKey) ?? "");
  }, [paramKey, searchParams]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updateQuery = React.useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextValue) {
        params.set(paramKey, nextValue);
      } else {
        params.delete(paramKey);
      }

      params.delete("page");

      const queryString = params.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(target, { scroll: false });
    },
    [paramKey, pathname, router, searchParams],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateQuery(nextValue.trim());
    }, debounceMs);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      className={cn("w-full min-w-[220px] md:w-64", className)}
      placeholder="Search..."
      {...props}
    />
  );
}
