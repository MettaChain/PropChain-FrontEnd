import { create } from 'zustand';

interface ErrorFallbackStore {
  isShowingDetails: boolean;
  toggleDetails: () => void;
  reset: () => void;
}

export const useErrorFallbackStore = create<ErrorFallbackStore>((set) => ({
  isShowingDetails: false,
  toggleDetails: () => set((state) => ({ isShowingDetails: !state.isShowingDetails })),
  reset: () => set({ isShowingDetails: false }),
}));
