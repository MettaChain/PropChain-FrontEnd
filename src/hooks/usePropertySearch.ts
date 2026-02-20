import { useEffect, useState } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { propertyService } from '@/lib/propertyService';
import { useSearchParams, useRouter } from 'next/navigation';
import { filtersToUrlParams, urlParamsToFilters } from '@/utils/searchUtils';

/**
 * Custom hook for property search functionality
 * Combines search store, API calls, and URL synchronization
 */

export function usePropertySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    filters,
    sortBy,
    page,
    resultsPerPage,
    properties,
    totalResults,
    isLoading,
    error,
    setFilters,
    setFilter,
    clearFilters,
    setSortBy,
    setPage,
    setProperties,
    setLoading,
    setError,
    lastUpdated,
  } = useSearchStore();

  // Initialize from URL parameters on mount
  useEffect(() => {
    if (!isInitialized && searchParams) {
      const { filters: urlFilters, sortBy: urlSortBy } = urlParamsToFilters(searchParams);
      
      if (Object.keys(urlFilters).length > 0) {
        setFilters(urlFilters);
      }
      
      if (urlSortBy && urlSortBy !== sortBy) {
        setSortBy(urlSortBy);
      }
      
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // Sync URL with state changes
  useEffect(() => {
    if (isInitialized) {
      const params = filtersToUrlParams(filters, sortBy);
      const currentParams = searchParams?.toString() || '';
      
      if (params !== currentParams) {
        router.push(`/properties?${params}`, { scroll: false });
      }
    }
  }, [filters, sortBy, isInitialized]);

  // Fetch properties when filters, sort, or page changes
  useEffect(() => {
    if (isInitialized) {
      fetchProperties();
    }
  }, [filters, sortBy, page, resultsPerPage, isInitialized]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await propertyService.searchProperties(
        filters,
        sortBy,
        page,
        resultsPerPage
      );

      setProperties(result.properties, result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch properties');
      setProperties([], 0);
    }
  };

  const handleFilterChange = <K extends keyof typeof filters>(
    key: K,
    value: typeof filters[K]
  ) => {
    setFilter(key, value);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return {
    // State
    filters,
    sortBy,
    page,
    resultsPerPage,
    properties,
    totalResults,
    totalPages,
    isLoading,
    error,
    lastUpdated,

    // Actions
    setFilter: handleFilterChange,
    clearFilters: handleClearFilters,
    setSortBy: handleSortChange,
    setPage: handlePageChange,
    refetch: fetchProperties,
  };
}
