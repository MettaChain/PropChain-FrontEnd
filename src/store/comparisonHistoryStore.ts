'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ComparisonHistory {
  id: string;
  propertyIds: string[];
  timestamp: number;
  shareUrl: string;
}

interface ComparisonHistoryStore {
  history: ComparisonHistory[];
  addComparison: (propertyIds: string[]) => void;
  removeComparison: (id: string) => void;
  clearHistory: () => void;
  getHistory: () => ComparisonHistory[];
}

const MAX_HISTORY = 5;

export const useComparisonHistoryStore = create<ComparisonHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],

      addComparison: (propertyIds: string[]) => {
        if (propertyIds.length === 0) return;

        const id = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const shareUrl = `/compare?ids=${propertyIds.join(',')}`;
        
        const newComparison: ComparisonHistory = {
          id,
          propertyIds,
          timestamp: Date.now(),
          shareUrl,
        };

        set((state) => {
          const updatedHistory = [newComparison, ...state.history].slice(0, MAX_HISTORY);
          return { history: updatedHistory };
        });
      },

      removeComparison: (id: string) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getHistory: () => {
        return get().history;
      },
    }),
    {
      name: 'propchain-comparison-history',
      partialize: (state) => ({ history: state.history }),
    }
  )
);
