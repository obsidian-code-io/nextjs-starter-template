"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  primaryAction?: React.ReactNode;
  isSearching?: boolean;
}

export function TableToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onSubmit,
  onClear,
  primaryAction,
  isSearching,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form
        className="flex flex-1 items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="relative flex w-full items-center gap-2">
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full"
          />
          {searchValue && onClear && (
            <button
              type="button"
              className="absolute right-3 text-muted-foreground transition hover:text-foreground"
              onClick={onClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="secondary" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>
      {primaryAction && <div className="flex-shrink-0">{primaryAction}</div>}
    </div>
  );
}
