'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentlyViewedProperty {
  id: string;
  name: string;
  location: string;
  price: number;
  image: string;
  viewedAt: number;
}

interface RecentlyViewedStore {
  properties: RecentlyViewedProperty[];
  addProperty: (property: Omit<RecentlyViewedProperty, 'viewedAt'>) => void;
  removeProperty: (id: string) => void;
  clearHistory: () => void;
  getProperties: () => RecentlyViewedProperty[];
}

const MAX_RECENT = 10;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      properties: [],

      addProperty: (property) => {
        set((state) => {
          // Remove if already exists
          const filtered = state.properties.filter((p) => p.id !== property.id);
          // Add to beginning and limit to MAX_RECENT
          const updated = [
            { ...property, viewedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_RECENT);
          return { properties: updated };
        });
      },

      removeProperty: (id: string) => {
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        }));
      },

      clearHistory: () => {
        set({ properties: [] });
      },

      getProperties: () => {
        return get().properties;
      },
    }),
    {
      name: 'propchain-recently-viewed',
      partialize: (state) => ({ properties: state.properties }),
    }
  )
);
