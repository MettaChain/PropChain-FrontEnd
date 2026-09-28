'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property } from '@/types/property';
import { generateSecureId } from '@/utils/secureId';

/** Most properties that can be compared at once. */
export const MAX_COMPARE = 3;

/** Most comparison snapshots retained in history. */
export const MAX_HISTORY = 5;

/** A saved comparison, shareable by URL. */
export interface ComparisonHistory {
  id: string;
  propertyIds: string[];
  timestamp: number;
  shareUrl: string;
}

interface CompareStore {
  // ── selection slice ────────────────────────────────────────────────────
  /**
   * The canonical selection. Ids rather than objects because an id is what the
   * share URL (`/compare?ids=…`) and persistence carry, and what a card knows
   * about itself.
   */
  selectedIds: string[];
  /**
   * Best-effort cache of the full objects, populated when a caller toggles with
   * a `Property` rather than a bare id.
   *
   * Deliberately not authoritative: a selection restored from storage or from a
   * share link has ids but no objects until something fetches them. UI that
   * needs an object must tolerate a miss — `getSelectedProperties()` drops
   * unresolved ids rather than inventing placeholders.
   */
  propertyCache: Record<string, Property>;

  addProperty: (target: Property | string) => void;
  removeProperty: (target: Property | string) => void;
  toggleProperty: (target: Property | string) => void;
  clearCompare: () => void;
  setSelectedIds: (ids: string[]) => void;
  isPropertySelected: (propertyId: string) => boolean;
  /** Selected properties resolvable from the cache, ordered by selection. */
  getSelectedProperties: () => Property[];

  // ── history slice ──────────────────────────────────────────────────────
  history: ComparisonHistory[];
  addComparison: (propertyIds: string[]) => void;
  removeComparison: (id: string) => void;
  clearHistory: () => void;
  getHistory: () => ComparisonHistory[];
}

/** Accepts either a `Property` or a bare id, since both call styles exist. */
const idOf = (target: Property | string): string =>
  typeof target === 'string' ? target : target.id;

/**
 * Canonical compare store: selection and history in one module (#1090).
 *
 * Previously three stores split this. `compareStore` held ids, `comparisonStore`
 * held whole `Property` objects under a separate persistence key, and
 * `comparisonHistoryStore` held snapshots. A fourth module,
 * `compareStoreCanonical`, declared `compareStore` authoritative but had no
 * importers, so it changed nothing.
 *
 * The split was not merely untidy. `PropertyCard` wrote to *both* selection
 * stores on every toggle while reading "is this selected" from one and "is the
 * limit reached" from the other, so the two could disagree — and `/compare` read
 * `comparisonStore` while `ComparisonBar` read `compareStore`, so the bar and
 * the page could show different selections. One store removes the class of bug
 * rather than patching an instance of it.
 */
export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      propertyCache: {},
      history: [],

      addProperty: (target) => {
        const id = idOf(target);

        set((state) => {
          if (state.selectedIds.includes(id) || state.selectedIds.length >= MAX_COMPARE) {
            return state;
          }

          return {
            selectedIds: [...state.selectedIds, id],
            propertyCache:
              typeof target === 'string'
                ? state.propertyCache
                : { ...state.propertyCache, [id]: target },
          };
        });
      },

      removeProperty: (target) => {
        const id = idOf(target);

        set((state) => {
          // The cache entry is dropped with the selection so a long session does
          // not accumulate objects for properties nobody is comparing.
          const { [id]: _removed, ...remainingCache } = state.propertyCache;

          return {
            selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
            propertyCache: remainingCache,
          };
        });
      },

      toggleProperty: (target) => {
        const id = idOf(target);

        if (get().selectedIds.includes(id)) {
          get().removeProperty(id);
          return;
        }

        get().addProperty(target);
      },

      clearCompare: () => set({ selectedIds: [], propertyCache: {} }),

      setSelectedIds: (ids) =>
        set((state) => {
          const capped = ids.slice(0, MAX_COMPARE);
          const cache: Record<string, Property> = {};

          for (const id of capped) {
            const cached = state.propertyCache[id];
            if (cached) cache[id] = cached;
          }

          return { selectedIds: capped, propertyCache: cache };
        }),

      isPropertySelected: (propertyId) => get().selectedIds.includes(propertyId),

      getSelectedProperties: () => {
        const { selectedIds, propertyCache } = get();

        return selectedIds
          .map((id) => propertyCache[id])
          .filter((property): property is Property => Boolean(property));
      },

      addComparison: (propertyIds) => {
        if (propertyIds.length === 0) return;

        const entry: ComparisonHistory = {
          id: generateSecureId('comp'),
          propertyIds,
          timestamp: Date.now(),
          shareUrl: `/compare?ids=${propertyIds.join(',')}`,
        };

        set((state) => ({
          history: [entry, ...state.history].slice(0, MAX_HISTORY),
        }));
      },

      removeComparison: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      getHistory: () => get().history,
    }),
    {
      // Same key as the previous selection store, so an existing selection
      // survives this refactor rather than being silently dropped.
      name: 'propchain-compare',
      version: 2,
      partialize: (state) => ({
        selectedIds: state.selectedIds,
        propertyCache: state.propertyCache,
        history: state.history,
      }),
      /**
       * v1 persisted only `selectedIds` under this key, and history lived under
       * `propchain-comparison-history`. Carry both forward so users do not lose
       * a selection or their recent comparisons on upgrade.
       */
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<CompareStore>;
        if (version >= 2) return state;

        let history: ComparisonHistory[] = state.history ?? [];

        if (history.length === 0 && typeof window !== 'undefined') {
          try {
            const legacy = window.localStorage.getItem('propchain-comparison-history');
            if (legacy) {
              const parsed = JSON.parse(legacy) as { state?: { history?: ComparisonHistory[] } };
              history = parsed.state?.history ?? [];
            }
          } catch {
            // A malformed or unreadable legacy entry is not worth failing the
            // upgrade over; history is recoverable by comparing again.
            history = [];
          }
        }

        return {
          ...state,
          selectedIds: state.selectedIds ?? [],
          propertyCache: state.propertyCache ?? {},
          history,
        };
      },
    },
  ),
);
