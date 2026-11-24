'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

export interface SearchResultsPaginationProps {
  totalResults: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: PageSize) => void;
}

function isPageSize(value: number): value is PageSize {
  return PAGE_SIZE_OPTIONS.some((pageSize) => pageSize === value);
}

function readUrlPagination() {
  const params = new URLSearchParams(window.location.search);
  const rawPage = Number(params.get('page'));
  const rawPageSize = Number(params.get('size'));

  return {
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: isPageSize(rawPageSize) ? rawPageSize : 10,
  };
}

function writeUrlPagination(page: number, pageSize: PageSize, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(pageSize));

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method](null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function SearchResultsPagination({
  totalResults,
  onPageChange,
  onPageSizeChange,
}: SearchResultsPaginationProps) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<PageSize>(10);
  const [jumpPage, setJumpPage] = React.useState('1');

  const pageCount = Math.ceil(Math.max(0, totalResults) / pageSize);
  const lastPage = Math.max(pageCount, 1);
  const currentPage = Math.min(page, lastPage);

  const syncFromUrl = React.useCallback(() => {
    const urlState = readUrlPagination();
    const nextPageSize = urlState.pageSize;
    const nextPage = Math.min(urlState.page, Math.max(1, Math.ceil(Math.max(0, totalResults) / nextPageSize)));

    setPage(nextPage);
    setPageSize(nextPageSize);
    setJumpPage(String(nextPage));

    if (urlState.page !== nextPage) {
      writeUrlPagination(nextPage, nextPageSize, true);
    }
  }, [totalResults]);

  React.useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [syncFromUrl]);

  React.useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
      setJumpPage(String(currentPage));
      writeUrlPagination(currentPage, pageSize, true);
      onPageChange?.(currentPage);
    }
  }, [currentPage, onPageChange, page, pageSize]);

  const changePage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), lastPage);
    setPage(boundedPage);
    setJumpPage(String(boundedPage));
    writeUrlPagination(boundedPage, pageSize);
    onPageChange?.(boundedPage);
  };

  const changePageSize = (nextPageSize: PageSize) => {
    setPageSize(nextPageSize);
    setPage(1);
    setJumpPage('1');
    writeUrlPagination(1, nextPageSize);
    onPageChange?.(1);
    onPageSizeChange?.(nextPageSize);
  };

  const submitJump = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedPage = Number(jumpPage);
    if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > lastPage) {
      setJumpPage(String(currentPage));
      return;
    }
    changePage(requestedPage);
  };

  const pageItems = React.useMemo<PageItem[]>(() => {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const items: PageItem[] = [1];
    if (currentPage > 3) items.push('ellipsis-start');
    for (let value = Math.max(2, currentPage - 1); value <= Math.min(lastPage - 1, currentPage + 1); value++) {
      items.push(value);
    }
    if (currentPage < lastPage - 2) items.push('ellipsis-end');
    items.push(lastPage);
    return items;
  }, [currentPage, lastPage]);

  const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);

  return (
    <nav
      aria-label="Search results pagination"
      className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row"
    >
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <p aria-live="polite" aria-atomic="true">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{rangeStart}–{rangeEnd}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalResults.toLocaleString()}</span> results
        </p>
        <label className="flex items-center gap-2">
          <span>Results per page</span>
          <select
            aria-label="Results per page"
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={pageSize}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (isPageSize(value)) changePageSize(value);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          className="inline-flex h-10 items-center gap-1 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled={currentPage <= 1}
          onClick={() => changePage(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {pageItems.map((item, index) => item === 'ellipsis-start' || item === 'ellipsis-end' ? (
          <span key={item} aria-hidden="true" className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={`${item}-${index}`}
            type="button"
            aria-label={`Go to page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`h-10 min-w-10 rounded-md px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              item === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => changePage(item)}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          aria-label="Next page"
          className="inline-flex h-10 items-center gap-1 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled={currentPage >= lastPage}
          onClick={() => changePage(currentPage + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {lastPage > 7 && (
        <form className="flex items-center gap-2 text-sm" onSubmit={submitJump}>
          <label htmlFor="search-results-jump-page">Go to page</label>
          <input
            id="search-results-jump-page"
            aria-label="Go to page"
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            type="number"
            min={1}
            max={lastPage}
            value={jumpPage}
            onChange={(event) => setJumpPage(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Go
          </button>
        </form>
      )}
    </nav>
  );
}

export default SearchResultsPagination;
