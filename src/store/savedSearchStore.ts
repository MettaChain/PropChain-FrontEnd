import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedSearch } from '@/types/property';
import { propertyService } from '@/lib/propertyService';
import { withAsyncAction } from './base';
import { getErrorMessage } from '@/utils/typeGuards';

/**
 * Saved Searches Store
 * Manages user's saved search queries
 */

interface SavedSearchState {
  searches: SavedSearch[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface SavedSearchActions {
  loadSearches: (userId: string) => Promise<void>;
  addSearch: (search: SavedSearch) => void;
  removeSearch: (searchId: string, userId: string) => Promise<void>;
  clearSearches: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
}

export type SavedSearchStore = SavedSearchState & SavedSearchActions;

export const useSavedSearchStore = create<SavedSearchStore>()(
  persist(
    (set: (partial: SavedSearchStore | Partial<SavedSearchStore> | ((state: SavedSearchStore) => Partial<SavedSearchStore>)) => void, get: () => SavedSearchStore) => ({
      searches: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      loadSearches: async (userId: string) => {
        await withAsyncAction(
          async () => {
            const searches = await propertyService.getSavedSearches(userId);
            set({ searches, lastUpdated: Date.now() });
            return searches;
          },
          (error) => set({ error }),
          (loading) => set({ isLoading: loading })
        );
      },

      addSearch: (search: SavedSearch) => {
        set((state) => ({
          searches: [...state.searches, search],
          lastUpdated: Date.now(),
        }));
      },

      removeSearch: async (searchId: string, userId: string) => {
        await withAsyncAction(
          async () => {
            await propertyService.deleteSavedSearch(userId, searchId);
            set((state) => ({
              searches: state.searches.filter(s => s.id !== searchId),
              lastUpdated: Date.now(),
            }));
          },
          (error) => set({ error }),
          (loading) => set({ isLoading: loading })
        );
      },

      clearSearches: () => {
        set({ searches: [], lastUpdated: Date.now() });
      },
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setLastUpdated: (timestamp: number) => set({ lastUpdated: timestamp }),
      reset: () => set({
        searches: [],
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      }),
    }),
    {
      name: 'propchain-saved-searches',
      partialize: (state: SavedSearchStore) => ({
        searches: state.searches,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
