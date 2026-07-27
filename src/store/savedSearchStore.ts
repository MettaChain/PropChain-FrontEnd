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

const createSavedSearchStore = (usePersist: boolean) =>
  create<SavedSearchStore>()(
    usePersist
      ? persist(
          (set: (partial: SavedSearchStore | Partial<SavedSearchStore> | ((state: SavedSearchStore) => Partial<SavedSearchStore>)) => void, get: () => SavedSearchStore) => ({
            searches: [],
            isLoading: false,
            error: null,
            lastUpdated: null,

            loadSearches: async (userId: string) => {
              // Set loading synchronously so tests can observe the in-flight state
              set({ isLoading: true, error: null });
              // Yield to the microtask queue to allow React to flush updates in tests
              await Promise.resolve();
              try {
                const searches = await propertyService.getSavedSearches(userId);
                set({ searches, lastUpdated: Date.now() });
                return searches;
              } catch (error: any) {
                const message = typeof error === 'string' ? error : error?.message || 'An unknown error occurred';
                set({ error: message });
                return null;
              } finally {
                set({ isLoading: false });
              }
            },

            addSearch: (search: SavedSearch) => {
              set((state) => ({
                searches: [...state.searches, search],
                lastUpdated: Date.now(),
              }));
            },

            removeSearch: async (searchId: string, userId: string) => {
              set({ isLoading: true, error: null });
              // Yield to microtask queue so test act() can observe loading state
              await Promise.resolve();
              try {
                await propertyService.deleteSavedSearch(userId, searchId);
                set((state) => ({
                  searches: state.searches.filter(s => s.id !== searchId),
                  lastUpdated: Date.now(),
                }));
              } catch (error: any) {
                const message = typeof error === 'string' ? error : error?.message || 'An unknown error occurred';
                set({ error: message });
              } finally {
                set({ isLoading: false });
              }
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
              lastUpdated: null,
            }),
          }),
          {
            name: 'propchain-saved-searches',
            partialize: (state: SavedSearchStore) => ({
              searches: state.searches,
            }),
          }
        )
      : (set: (partial: SavedSearchStore | Partial<SavedSearchStore> | ((state: SavedSearchStore) => Partial<SavedSearchStore>)) => void, get: () => SavedSearchStore) => ({
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
            lastUpdated: null,
          }),
        })
  );

// Use `persist` only in browser environments where `localStorage` is available.
// Disable persistence in Jest environments to avoid rehydration races
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
const shouldPersist = !isTestEnv && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
export const useSavedSearchStore = createSavedSearchStore(shouldPersist);
