'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareStore {
  selectedIds: string[];
  addProperty: (id: string) => void;
  removeProperty: (id: string) => void;
  toggleProperty: (id: string) => void;
  clearCompare: () => void;
  setSelectedIds: (ids: string[]) => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      selectedIds: [],

      addProperty: (id: string) => {
        set((state) => {
          if (state.selectedIds.includes(id) || state.selectedIds.length >= 3) {
            return state;
          }

          return {
            selectedIds: [...state.selectedIds, id],
          };
        });
      },

      removeProperty: (id: string) => {
        set((state) => ({
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
        }));
      },

      toggleProperty: (id: string) => {
        set((state) => {
          if (state.selectedIds.includes(id)) {
            return {
              selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
            };
          }

          if (state.selectedIds.length >= 3) {
            return state;
          }

          return {
            selectedIds: [...state.selectedIds, id],
          };
        });
      },

      clearCompare: () => {
        set({ selectedIds: [] });
      },

      setSelectedIds: (ids: string[]) => {
        set({ selectedIds: ids.slice(0, 3) });
      },
    }),
    {
      name: 'propchain-compare',
      partialize: (state) => ({ selectedIds: state.selectedIds }),
    }
  )
);
