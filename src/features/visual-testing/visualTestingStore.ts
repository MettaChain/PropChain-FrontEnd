import { create } from 'zustand';
import { ModalType, Breakpoint } from './visualTestingTypes';

interface VisualTestingStore {
  activeModal: ModalType;
  breakpoint: Breakpoint;
  theme: 'light' | 'dark';
  setTestConfig: (config: { modal?: ModalType; breakpoint?: Breakpoint; theme?: 'light' | 'dark' }) => void;
  reset: () => void;
}

export const useVisualTestingStore = create<VisualTestingStore>((set) => ({
  activeModal: 'NONE',
  breakpoint: 'DESKTOP',
  theme: 'light',
  setTestConfig: (config) => set((state) => ({ ...state, ...config })),
  reset: () => set({ activeModal: 'NONE', breakpoint: 'DESKTOP', theme: 'light' }),
}));
