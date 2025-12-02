"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UniversalTable, UniversalTableColumn } from "./universal-table";
import { TableToolbar } from "./table-toolbar";
import { PaginationControls } from "./pagination-controls";

interface PaginatedTableProps<T> {
  basePath: string;
  columns: UniversalTableColumn<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  search?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  primaryAction?: React.ReactNode;
  pageSizeOptions?: number[];
}

export function PaginatedTable<T>({
  basePath,
  columns,
  data,
  total,
  page,
  pageSize,
  search = "",
  searchPlaceholder,
  emptyMessage,
  primaryAction,
  pageSizeOptions,
}: PaginatedTableProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(search);

  React.useEffect(() => {
    setSearchValue(search);
  }, [search]);

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const query = params.toString();
      router.push(query ? `${basePath}?${params.toString()}` : basePath, {
        scroll: false,
      });
    },
    [basePath, router, searchParams],
  );

  const handleSearchSubmit = React.useCallback(() => {
    updateQuery({
      q: searchValue.trim() || null,
      page: "1",
    });
  }, [searchValue, updateQuery]);

  const handleClearSearch = React.useCallback(() => {
    setSearchValue("");
    updateQuery({ q: null, page: "1" });
  }, [updateQuery]);

  const handlePageChange = React.useCallback(
    (nextPage: number) => {
      updateQuery({ page: String(nextPage) });
    },
    [updateQuery],
  );

  const handlePageSizeChange = React.useCallback(
    (nextSize: number) => {
      updateQuery({ pageSize: String(nextSize), page: "1" });
    },
    [updateQuery],
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background/60 p-4 shadow-sm">
      <TableToolbar
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSubmit={handleSearchSubmit}
        onClear={searchValue ? handleClearSearch : undefined}
        primaryAction={primaryAction}
      />
      <UniversalTable
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
      />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
