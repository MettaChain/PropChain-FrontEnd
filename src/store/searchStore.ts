import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FILTERS } from '@/types/property';
import type { SearchFilters, SortOption, ViewMode, Property } from '@/types/property';

/**
 * Search Store
 * Global state management for property search and filtering
 */

interface SearchState {
  // Filters
  filters: SearchFilters;
  sortBy: SortOption;
  viewMode: ViewMode;
  
  // Pagination
  page: number;
  resultsPerPage: number;
  totalResults: number;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Results
  properties: Property[];
  
  // Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: SortOption) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setPage: (page: number) => void;
  setResultsPerPage: (count: number) => void;
  setProperties: (properties: Property[], total: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const DEFAULT_STATE: Omit<SearchState, 'setFilters' | 'setFilter' | 'clearFilters' | 'setSortBy' | 'setViewMode' | 'setPage' | 'setResultsPerPage' | 'setProperties' | 'setLoading' | 'setError' | 'reset'> = {
  filters: {
    ...DEFAULT_FILTERS,
    priceRange: [...DEFAULT_FILTERS.priceRange] as [number, number],
    squareFeetRange: [...DEFAULT_FILTERS.squareFeetRange] as [number, number],
    propertyTypes: [...DEFAULT_FILTERS.propertyTypes],
    blockchains: [...DEFAULT_FILTERS.blockchains],
    bedrooms: [...DEFAULT_FILTERS.bedrooms],
    bathrooms: [...DEFAULT_FILTERS.bathrooms],
    status: [...DEFAULT_FILTERS.status],
  },
  sortBy: 'newest' as SortOption,
  viewMode: 'grid' as ViewMode,
  page: 1,
  resultsPerPage: 12,
  totalResults: 0,
  isLoading: false,
  error: null,
  properties: [],
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          page: 1, // Reset to first page when filters change
        }));
      },

      setFilter: (key, value) => {
        set((state) => ({
          filters: { ...state.filters, [key]: value },
          page: 1,
        }));
      },

      clearFilters: () => {
        set({
          filters: DEFAULT_STATE.filters,
          page: 1,
        });
      },

      setSortBy: (sortBy) => {
        set({ sortBy, page: 1 });
      },

      setViewMode: (viewMode) => {
        set({ viewMode });
      },

      setPage: (page) => {
        set({ page });
      },

      setResultsPerPage: (resultsPerPage) => {
        set({ resultsPerPage, page: 1 });
      },

      setProperties: (properties, total) => {
        set({
          properties,
          totalResults: total,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      reset: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: 'propchain-search',
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        resultsPerPage: state.resultsPerPage,
      }),
    }
  )
);
