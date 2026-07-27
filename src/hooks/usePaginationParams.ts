'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function isValidPageSize(value: number): value is PageSize {
  return PAGE_SIZE_OPTIONS.includes(value as PageSize);
}

export interface PaginationParams {
  page: number;
  size: PageSize;
}

/**
 * Reads ?page and ?size from the URL and provides setters that update the URL.
 * Keeps the Zustand store in sync so the React Query hook picks up the changes.
 */
export function usePaginationParams(): PaginationParams & {
  setPage: (page: number) => void;
  setSize: (size: PageSize) => void;
  buildHref: (page: number, size?: PageSize) => string;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const rawSize = parseInt(searchParams.get('size') ?? '12', 10);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const size: PageSize = isValidPageSize(rawSize) ? rawSize : 12;

  /** Build a URL string with updated pagination params, preserving other params */
  const buildHref = useCallback(
    (newPage: number, newSize: PageSize = size) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      params.set('size', String(newSize));
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams, size],
  );

  const setPage = useCallback(
    (newPage: number) => {
      router.push(buildHref(newPage), { scroll: false });
      // Scroll to top of results smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, buildHref],
  );

  const setSize = useCallback(
    (newSize: PageSize) => {
      // Reset to page 1 when page size changes
      router.push(buildHref(1, newSize), { scroll: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, buildHref],
  );

  return { page, size, setPage, setSize, buildHref };
}
