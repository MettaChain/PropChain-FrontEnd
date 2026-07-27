import { create } from 'zustand';
import { Web3Error } from './web3ErrorTypes';

interface Web3ErrorState {
  lastError: Web3Error | null;
  setLastError: (error: Web3Error | null) => void;
  clearError: () => void;
}

export const useWeb3ErrorStore = create<Web3ErrorState>((set) => ({
  lastError: null,
  setLastError: (error) => set({ lastError: error }),
  clearError: () => set({ lastError: null }),
}));
