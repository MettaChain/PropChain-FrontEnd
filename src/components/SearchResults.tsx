'use client';

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PropertyCard } from './PropertyCard';
import { ComparisonBar } from './ComparisonBar';
import { SaveSearchButton } from './SaveSearchButton';
import type { Property, ViewMode, SortOption, SearchFilters } from '@/types/property';
import { SORT_LABELS } from '@/types/property';

interface SearchResultsProps {
  properties: Property[];
  totalResults: number;
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  sortBy: SortOption;
  page: number;
  totalPages: number;
  filters: SearchFilters;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (sort: SortOption) => void;
  onPageChange: (page: number) => void;
  onLoadMore?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  properties,
  totalResults,
  isLoading,
  error,
  viewMode,
  sortBy,
  page,
  totalPages,
  filters,
  onViewModeChange,
  onSortChange,
  onPageChange,
  onLoadMore,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [displayProperties, setDisplayProperties] = React.useState<Property[]>(properties);
  const previousQueryKey = React.useRef<string>('');

  // Determine columns based on viewMode and responsive breakpoints
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

  useEffect(() => {
    const queryKey = JSON.stringify({ filters, sortBy });

    if (page === 1 || previousQueryKey.current !== queryKey) {
      setDisplayProperties(properties);
    } else if (page > 1 && !isLoading) {
      setDisplayProperties((prev) => [...prev, ...properties]);
    }

    previousQueryKey.current = queryKey;
  }, [properties, page, sortBy, filters, isLoading]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !onLoadMore || isLoading || page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: parentRef.current,
        rootMargin: '400px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, isLoading, page, totalPages]);

  const rowCount = Math.ceil(displayProperties.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === 'grid' ? 450 : 200, // Estimated height of cards
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
    <div className="flex-1 relative">
      <ComparisonBar />
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLoading ? 'Searching...' : `${totalResults} Properties Found`}
          </h2>
          {page > 1 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Save Search Button */}
            <SaveSearchButton 
              filters={filters} 
              sortBy={sortBy}
              className="flex-shrink-0"
            />

            {/* Sort Dropdown */}
            <label htmlFor="sort-by" className="sr-only">Sort properties</label>
            <select
              id="sort-by"
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
          </div>
          {/* View Mode Toggle */}
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

      {/* Main Results Container (Virtualized) */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        style={{ minHeight: '500px' }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-56 bg-gray-300 dark:bg-gray-700" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Try adjusting your filters or search criteria to find more properties.
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const start = virtualRow.index * columns;
              const rowProperties = displayProperties.slice(start, start + columns);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    "grid gap-6",
                    viewMode === 'grid' 
                      ? columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1"
                      : "grid-cols-1"
                  )}
                >
                  {rowProperties.map((property) => (
                    <div key={property.id} className="pb-6">
                      <PropertyCard property={property} viewMode={viewMode} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination (Sticky Footer) */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-4 py-6 border-t mt-auto bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;

                return (
                  <button
                    key={i}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>

          {onLoadMore && page < totalPages && (
            <div ref={loadMoreRef} className="text-center">
              <button
                type="button"
                onClick={onLoadMore}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {isLoading ? 'Loading more properties...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

