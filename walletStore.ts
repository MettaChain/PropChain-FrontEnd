import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  setConnection: (address: string, chainId: number) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  updateChainId: (chainId: number) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,

      setConnection: (address, chainId) => set({
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
        error: null,
      }),

      setConnecting: (isConnecting) => set({ isConnecting }),
      
      setError: (error) => set({ error, isConnecting: false }),

      updateChainId: (chainId) => set({ chainId }),

      disconnect: () => set({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
      }),
    }),
    {
      name: 'propchain-wallet-storage',
      // Only persist connection info, not transient loading/error states
      partialize: (state) => ({ address: state.address, chainId: state.chainId, isConnected: state.isConnected }),
    }
  )
);