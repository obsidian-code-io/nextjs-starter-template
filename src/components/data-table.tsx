"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
  width?: string;
}

export interface DataTableRow {
  id: string;
  cells: Record<string, React.ReactNode>;
  className?: string;
}

interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyMessage?: string;
  dense?: boolean;
  className?: string;
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found.",
  dense = false,
  className,
}: DataTableProps) {
  const cellPadding = dense ? "py-2" : "py-3";

  return (
    <div className={cn("overflow-x-auto rounded-lg border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.className,
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className={row.className}>
                {columns.map((column) => (
                  <TableCell
                    key={`${row.id}-${column.key}`}
                    className={cn(
                      "text-sm",
                      cellPadding,
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.className,
                    )}
                  >
                    {row.cells[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
