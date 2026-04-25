import { useQuery } from "@tanstack/react-query";
import { useSearchStore } from "@/store/searchStore";
import { propertyService } from "@/lib/propertyService";
import type { SearchFilters, SortOption, PropertySearchResult } from "@/types/property";

/**
 * React Query hook for property search functionality
 * Replaces the original usePropertySearch hook with React Query caching
 */

// Query key factory for property search queries
export const propertySearchQueryKeys = {
  all: ["propertySearch"] as const,
  searches: (filters: SearchFilters, sortBy: SortOption, page: number, resultsPerPage: number) => 
    ["propertySearch", "search", filters, sortBy, page, resultsPerPage] as const,
  autocomplete: (query: string) => ["propertySearch", "autocomplete", query] as const,
  property: (id: string) => ["propertySearch", "property", id] as const,
};

/**
 * Hook for searching properties with filters and pagination
 */
export function usePropertySearchQuery(
  filters: SearchFilters,
  sortBy: SortOption = 'newest',
  page: number = 1,
  resultsPerPage: number = 12
) {
  const query = useQuery({
    queryKey: propertySearchQueryKeys.searches(filters, sortBy, page, resultsPerPage),
    queryFn: () => propertyService.searchProperties(filters, sortBy, page, resultsPerPage),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: true, // Always enabled since we have default values
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  return query;
}

/**
 * Hook for getting autocomplete suggestions
 */
export function usePropertyAutocompleteQuery(query: string) {
  return useQuery({
    queryKey: propertySearchQueryKeys.autocomplete(query),
    queryFn: () => propertyService.getAutocompleteSuggestions(query),
    enabled: query.length >= 2, // Only fetch when query has at least 2 characters
    staleTime: 1000 * 60 * 2, // 2 minutes for autocomplete
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Only retry autocomplete once
  });
}

/**
 * Hook for getting a single property by ID
 */
export function usePropertyQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: propertySearchQueryKeys.property(id),
    queryFn: () => propertyService.getPropertyById(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes for individual properties
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Combined hook that maintains the same API as the original usePropertySearch
 * but uses React Query under the hood
 */
export function usePropertySearch() {
  const searchStore = useSearchStore();
  
  const {
    filters,
    sortBy,
    page,
    resultsPerPage,
    setFilters,
    setFilter,
    clearFilters,
    setSortBy,
    setPage,
  } = searchStore;

  const query = usePropertySearchQuery(filters, sortBy, page, resultsPerPage);

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

  const totalPages = query.data ? Math.ceil(query.data.total / resultsPerPage) : 0;

  return {
    // State
    filters,
    sortBy,
    page,
    resultsPerPage,
    properties: query.data?.properties || [],
    totalResults: query.data?.total || 0,
    totalPages,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : undefined,

    // Actions
    setFilter: handleFilterChange,
    clearFilters: handleClearFilters,
    setSortBy: handleSortChange,
    setPage: handlePageChange,
    refetch: query.refetch,
  };
}
