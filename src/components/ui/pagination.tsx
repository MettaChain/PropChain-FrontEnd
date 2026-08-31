"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage <= halfVisible + 1) {
      end = maxVisiblePages;
    }

    if (currentPage >= totalPages - halfVisible) {
      start = totalPages - maxVisiblePages + 1;
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("ellipsis");
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {showPageNumbers &&
        getPageNumbers().map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2">
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          )
        )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = React.useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const goToNextPage = React.useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPreviousPage = React.useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    startIndex,
    endIndex,
    totalItems,
  };
}

interface PaginatedListProps<T> {
  items: T[];
  itemsPerPage: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function PaginatedList<T>({
  items,
  itemsPerPage,
  renderItem,
  className,
}: PaginatedListProps<T>) {
  const pagination = usePagination({
    totalItems: items.length,
    itemsPerPage,
  });

  const currentItems = items.slice(pagination.startIndex, pagination.endIndex);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        {currentItems.map((item, index) =>
          renderItem(item, pagination.startIndex + index)
        )}
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.goToPage}
      />
    </div>
  );
}
