'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { filtersToUrlParams, urlParamsToFilters } from '@/utils/searchUtils';

/**
 * Query-string keys owned by `filtersToUrlParams`.
 *
 * Must stay in step with that function; `usePropertySearchUrlSync.test.ts`
 * asserts it does. Anything not in this list - `page` and `size`, owned by
 * `usePaginationParams` - is preserved across a filter change.
 */
export const FILTER_PARAM_KEYS = [
  'q',
  'minPrice',
  'maxPrice',
  'types',
  'chains',
  'minRoi',
  'maxRoi',
  'location',
  'bedrooms',
  'bathrooms',
  'minSqft',
  'maxSqft',
  'sort',
] as const;

/**
 * Keeps the search store and the URL query string in step (#1091).
 *
 * Extracted from the legacy `usePropertySearch` hook, which was the only place
 * URL synchronisation existed. That hook had no importers left, so filters were
 * not reaching the URL at all: a filtered search could not be linked, bookmarked
 * or restored by reload. Deleting it without porting this would have made the
 * loss permanent.
 *
 * Kept separate from `usePropertySearch` rather than folded into it, for two
 * reasons. `useSearchParams` requires a Suspense boundary, so baking it into the
 * data hook would force that on every consumer including plain lists and
 * autocomplete. And synchronising to a path means a hook that reads data would
 * quietly also drive navigation, which is surprising. Call this explicitly from
 * a page that owns a URL.
 *
 * @param basePath - Route the query string is written to.
 */
export function usePropertySearchUrlSync(basePath: string = '/properties'): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, sortBy, setFilters, setSortBy } = useSearchStore();

  // Gate both directions until the URL has been read once. Without it the
  // write-back effect fires against empty store state on first render and
  // immediately erases whatever the incoming URL asked for.
  const [isInitialized, setIsInitialized] = useState(false);

  // URL -> store, once on mount.
  useEffect(() => {
    if (isInitialized || !searchParams) return;

    const { filters: urlFilters, sortBy: urlSortBy } = urlParamsToFilters(
      new URLSearchParams(searchParams.toString()),
    );

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
    if (urlSortBy && urlSortBy !== sortBy) {
      setSortBy(urlSortBy);
    }

    setIsInitialized(true);
  }, [searchParams, isInitialized, sortBy, setFilters, setSortBy]);

  // store -> URL, on every subsequent change.
  useEffect(() => {
    if (!isInitialized) return;

    const current = searchParams?.toString() ?? '';

    // Merge rather than replace. filtersToUrlParams emits only filter and sort
    // keys, so pushing its output verbatim would drop `page` and `size`, which
    // usePaginationParams owns - a filter change would silently reset a
    // deep-linked page. The legacy hook replaced the string outright; it had no
    // consumers, so the bug was never hit.
    const merged = new URLSearchParams(current);
    for (const key of FILTER_PARAM_KEYS) {
      merged.delete(key);
    }
    for (const [key, value] of new URLSearchParams(filtersToUrlParams(filters, sortBy))) {
      merged.set(key, value);
    }
    merged.sort();

    const next = merged.toString();
    const normalisedCurrent = (() => {
      const c = new URLSearchParams(current);
      c.sort();
      return c.toString();
    })();

    // Comparing before pushing matters: an unconditional push on every render
    // would spam the history stack and re-trigger this effect.
    if (next === normalisedCurrent) return;

    router.push(next ? `${basePath}?${next}` : basePath, { scroll: false });
  }, [filters, sortBy, isInitialized, basePath, router, searchParams]);
}
