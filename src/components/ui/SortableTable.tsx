"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  let comparison = 0;

  if (typeof a === "string" && typeof b === "string") {
    comparison = a.localeCompare(b);
  } else if (typeof a === "number" && typeof b === "number") {
    comparison = a - b;
  } else {
    comparison = String(a).localeCompare(String(b));
  }

  return direction === "desc" ? -comparison : comparison;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

interface UseTableSortOptions<T> {
  data: T[];
  defaultSortKey?: string;
  defaultDirection?: SortDirection;
}

export function useTableSort<T extends Record<string, unknown>>({
  data,
  defaultSortKey,
  defaultDirection = "asc",
}: UseTableSortOptions<T>) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: defaultSortKey || "",
    direction: defaultSortKey ? defaultDirection : null,
  });

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);
      return compareValues(aValue, bValue, sortConfig.direction);
    });
  }, [data, sortConfig]);

  const requestSort = React.useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  }, []);

  const clearSort = React.useCallback(() => {
    setSortConfig({ key: "", direction: null });
  }, []);

  return {
    sortedData,
    sortConfig,
    requestSort,
    clearSort,
    getSortDirection: (key: string): SortDirection => {
      if (sortConfig.key === key) {
        return sortConfig.direction;
      }
      return null;
    },
  };
}

interface SortableHeaderProps {
  sortKey: string;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableHeader({
  sortKey,
  sortDirection,
  onSort,
  children,
  className,
}: SortableHeaderProps) {
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-left font-medium hover:text-foreground",
        className
      )}
    >
      {children}
      <span className="flex-shrink-0">
        {sortDirection === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : sortDirection === "desc" ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </span>
    </button>
  );
}

interface SortableTableHeaderProps {
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
  }[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export function SortableTableHeader({
  columns,
  sortConfig,
  onSort,
}: SortableTableHeaderProps) {
  return (
    <thead>
      <tr>
        {columns.map((column) => (
          <th key={column.key} className={column.className}>
            {column.sortable ? (
              <SortableHeader
                sortKey={column.key}
                sortDirection={sortConfig.key === column.key ? sortConfig.direction : null}
                onSort={onSort}
              >
                {column.label}
              </SortableHeader>
            ) : (
              column.label
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface SortIndicatorProps {
  direction: SortDirection;
  className?: string;
}

export function SortIndicator({ direction, className }: SortIndicatorProps) {
  return (
    <span className={cn("inline-flex", className)}>
      {direction === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : direction === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : null}
    </span>
  );
}
