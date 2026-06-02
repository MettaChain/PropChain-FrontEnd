'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Property } from '@/types/property';

interface FavoritesState {
  favorites: Property[];
  addFavorite: (property: Property) => void;
  removeFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  clearFavorites: () => void;
  getFavoritesCount: () => number;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (property: Property) =>
        set((state) => ({
          favorites: [...state.favorites, property],
        })),

      removeFavorite: (propertyId: string) =>
        set((state) => ({
          favorites: state.favorites.filter((prop) => prop.id !== propertyId),
        })),

      isFavorite: (propertyId: string) =>
        get().favorites.some((prop) => prop.id === propertyId),

      clearFavorites: () => set({ favorites: [] }),

      getFavoritesCount: () => get().favorites.length,
    }),
    {
      name: 'propchain-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);