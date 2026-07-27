"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: SortDirection) => void;
  stickyHeader?: boolean;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "No data available",
  onSort,
  stickyHeader = true,
  className,
  headerClassName,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  const handleSort = (key: string) => {
    let newDirection: SortDirection;

    if (sortKey === key) {
      if (sortDirection === null) newDirection = "asc";
      else if (sortDirection === "asc") newDirection = "desc";
      else newDirection = null;
    } else {
      newDirection = "asc";
    }

    setSortKey(newDirection ? key : null);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead
            className={cn(
              stickyHeader && "sticky top-0 z-10 bg-white dark:bg-gray-900",
              headerClassName
            )}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
                    column.sortable && "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300",
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    onRowClick && "cursor-pointer",
                    typeof rowClassName === "function" ? rowClassName(item, index) : rowClassName
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100",
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(item, index)
                        : (item as Record<string, unknown>)[column.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
