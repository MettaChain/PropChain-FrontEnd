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
  lastUpdated: number | null;
  
  // Results
  properties: Property[];
}

interface SearchActions {
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
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
}

export type SearchStore = SearchState & SearchActions;

const DEFAULT_STATE = {
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
  lastUpdated: null,
  properties: [],
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set: (partial: SearchStore | Partial<SearchStore> | ((state: SearchStore) => Partial<SearchStore>)) => void, get: () => SearchStore) => ({
      ...DEFAULT_STATE,

      setFilters: (newFilters: Partial<SearchFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          page: 1, // Reset to first page when filters change
          lastUpdated: Date.now(),
        }));
      },

      setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
        set((state) => ({
          filters: { ...state.filters, [key]: value },
          page: 1,
          lastUpdated: Date.now(),
        }));
      },

      clearFilters: () => {
        set({
          filters: DEFAULT_STATE.filters,
          page: 1,
          lastUpdated: Date.now(),
        });
      },

      setSortBy: (sortBy: SortOption) => {
        set({ sortBy, page: 1, lastUpdated: Date.now() });
      },

      setViewMode: (viewMode: ViewMode) => {
        set({ viewMode, lastUpdated: Date.now() });
      },

      setPage: (page: number) => {
        set({ page, lastUpdated: Date.now() });
      },

      setResultsPerPage: (resultsPerPage: number) => {
        set({ resultsPerPage, page: 1, lastUpdated: Date.now() });
      },

      setProperties: (properties: Property[], total: number) => {
        set({
          properties,
          totalResults: total,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      setLastUpdated: (timestamp: number) => {
        set({ lastUpdated: timestamp });
      },

      reset: () => {
        set({...DEFAULT_STATE, lastUpdated: Date.now()});
      },
    }),
    {
      name: 'propchain-search',
      partialize: (state: SearchStore) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        resultsPerPage: state.resultsPerPage,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
