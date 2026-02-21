import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedSearch } from '@/types/property';
import { propertyService } from '@/lib/propertyService';
import { getErrorMessage } from '@/utils/typeGuards';

/**
 * Saved Searches Store
 * Manages user's saved search queries
 */

interface SavedSearchState {
  searches: SavedSearch[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSearches: (userId: string) => Promise<void>;
  addSearch: (search: SavedSearch) => void;
  removeSearch: (searchId: string, userId: string) => Promise<void>;
  clearSearches: () => void;
}

export const useSavedSearchStore = create<SavedSearchState>()(
  persist(
    (set, get) => ({
      searches: [],
      isLoading: false,
      error: null,

      loadSearches: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const searches = await propertyService.getSavedSearches(userId);
          set({ searches, isLoading: false });
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to load saved searches'), isLoading: false });
        }
      },

      addSearch: (search: SavedSearch) => {
        set((state) => ({
          searches: [...state.searches, search],
        }));
      },

      removeSearch: async (searchId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await propertyService.deleteSavedSearch(userId, searchId);
          set((state) => ({
            searches: state.searches.filter(s => s.id !== searchId),
            isLoading: false,
          }));
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to remove saved search'), isLoading: false });
        }
      },

      clearSearches: () => {
        set({ searches: [] });
      },
    }),
    {
      name: 'propchain-saved-searches',
      partialize: (state) => ({
        searches: state.searches,
      }),
    }
  )
);
