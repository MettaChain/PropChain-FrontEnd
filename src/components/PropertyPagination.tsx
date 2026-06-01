'use client';

import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/hooks/usePaginationParams';

interface PropertyPaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  /** Optional: pre-built href for each page number (enables native link behaviour) */
  buildHref?: (page: number) => string;
}

/**
 * Full-featured pagination bar:
 * - Page size selector (12 / 24 / 48)
 * - Total count display
 * - Previous / Next buttons
 * - Numbered page buttons with ellipsis
 * - Keyboard navigation (← →, Home, End)
 */
export const PropertyPagination: React.FC<PropertyPaginationProps> = ({
  page,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  buildHref,
}) => {
  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only fire when no input/textarea/select is focused
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      if (e.key === 'ArrowLeft' && page > 1) {
        e.preventDefault();
        onPageChange(page - 1);
      } else if (e.key === 'ArrowRight' && page < totalPages) {
        e.preventDefault();
        onPageChange(page + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        onPageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        onPageChange(totalPages);
      }
    },
    [page, totalPages, onPageChange],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Page number window ───────────────────────────────────────────────────
  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];

    if (page > 3) pages.push('ellipsis-start');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('ellipsis-end');

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // ── Range display ────────────────────────────────────────────────────────
  const rangeStart = Math.min((page - 1) * pageSize + 1, totalResults);
  const rangeEnd = Math.min(page * pageSize, totalResults);

  if (totalPages <= 1 && totalResults <= pageSize) return null;

  return (
    <nav
      aria-label="Property listings pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700"
    >
      {/* ── Left: total count + page size selector ── */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span aria-live="polite" aria-atomic="true">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {rangeStart}–{rangeEnd}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {totalResults}
          </span>{' '}
          properties
        </span>

        <label className="flex items-center gap-2">
          <span className="sr-only">Results per page</span>
          <span className="hidden sm:inline">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Results per page"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Right: page controls ── */}
      <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
        {/* Previous */}
        <PageButton
          onClick={() => onPageChange(page - 1)}
          href={buildHref ? buildHref(page - 1) : undefined}
          disabled={page === 1}
          aria-label="Go to previous page"
          title="Previous page (←)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </PageButton>

        {/* Page numbers */}
        {pageNumbers.map((p, idx) => {
          if (p === 'ellipsis-start' || p === 'ellipsis-end') {
            return (
              <span
                key={p}
                className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 select-none"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const isActive = p === page;
          return (
            <PageButton
              key={p}
              onClick={() => onPageChange(p)}
              href={buildHref ? buildHref(p) : undefined}
              active={isActive}
              aria-label={`Go to page ${p}`}
              aria-current={isActive ? 'page' : undefined}
              title={`Page ${p}`}
            >
              {p}
            </PageButton>
          );
        })}

        {/* Next */}
        <PageButton
          onClick={() => onPageChange(page + 1)}
          href={buildHref ? buildHref(page + 1) : undefined}
          disabled={page === totalPages}
          aria-label="Go to next page"
          title="Next page (→)"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </PageButton>
      </div>
    </nav>
  );
};

// ── Internal helper ──────────────────────────────────────────────────────────

interface PageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  active?: boolean;
  children: React.ReactNode;
}

const PageButton: React.FC<PageButtonProps> = ({
  href,
  active = false,
  disabled = false,
  children,
  onClick,
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center min-w-[2.5rem] h-10 px-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  const activeClass = 'bg-blue-600 text-white shadow-sm';
  const inactiveClass =
    'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700';
  const disabledClass = 'opacity-40 cursor-not-allowed pointer-events-none';

  const className = [
    base,
    active ? activeClass : inactiveClass,
    disabled ? disabledClass : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Use an <a> tag when href is provided so the browser can prefetch / open in new tab
  if (href && !disabled) {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }}
        className={className}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
};
