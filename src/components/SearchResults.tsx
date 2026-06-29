'use client';

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PropertyCard } from './PropertyCard';
import { SaveSearchButton } from './SaveSearchButton';
import { PropertyPagination } from './PropertyPagination';
import type { Property, ViewMode, SortOption, SearchFilters } from '@/types/property';
import { SORT_LABELS } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonBar } from './ComparisonBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search } from 'lucide-react';
import type { PageSize } from '@/hooks/usePaginationParams';

interface SearchResultsProps {
  properties: Property[];
  totalResults: number;
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  sortBy: SortOption;
  page: number;
  totalPages: number;
  pageSize: PageSize;
  filters: SearchFilters;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (sort: SortOption) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  /** Optional href builder for accessible anchor-based page links */
  buildPageHref?: (page: number) => string;
}

const SearchResultsInner: React.FC<SearchResultsProps> = ({
  properties,
  totalResults,
  isLoading,
  error,
  viewMode,
  sortBy,
  page,
  totalPages,
  pageSize,
  filters,
  onViewModeChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  buildPageHref,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const [columns, setColumns] = React.useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (viewMode === 'list') {
        setColumns(1);
        return;
      }
      if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [viewMode]);

  const rowCount = Math.ceil(properties.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (viewMode === 'grid' ? 450 : 200),
    overscan: 5,
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLoading ? 'Searching...' : `${totalResults.toLocaleString()} Properties Found`}
          </h2>
          {totalPages > 1 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SaveSearchButton
            filters={filters}
            sortBy={sortBy}
            className="flex-shrink-0"
          />

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ComparisonBar />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <Skeleton className="w-full h-56 rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && properties.length === 0 && (
        <EmptyState
          title="No properties found"
          description="Try adjusting your filters or search criteria to find more properties."
          icon={Search}
        />
      )}

      {/* Results Grid/List */}
      {!isLoading && properties.length > 0 && (
        <>
          {/*
           * Use a <ul role="list"> with <li role="article"> items so screen
           * readers (VoiceOver/NVDA) announce the result count and surface
           * each property as a discrete list item/article. role="list" is set
           * on the <ul> because Tailwind's `list-none` resets the implicit
           * role in some Safari builds.
           */}
          <ul
            role="list"
            aria-label={`Property listings, ${properties.length} ${properties.length === 1 ? 'item' : 'items'}`}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0'
                : 'flex flex-col gap-4 list-none p-0 m-0'
            }
          >
            {properties.map((property) => (
              <li key={property.id} role="article" aria-labelledby={`property-${property.id}-name`}>
                <PropertyCard property={property} viewMode={viewMode} />
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <PropertyPagination
            page={page}
            totalPages={totalPages}
            totalResults={totalResults}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            buildHref={buildPageHref}
          />
        </>
      )}
    </div>
  );
};

export const SearchResults = React.memo(SearchResultsInner);

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}