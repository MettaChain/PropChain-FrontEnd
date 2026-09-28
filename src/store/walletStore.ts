/**
 * Wallet Store
 *
 * NOTE: This store is a thin UI-state wrapper. The canonical source of truth
 * for wallet connection is wagmi's connector state. This store only holds
 * transient UI state (loading, error, switching) that wagmi doesn't track.
 *
 * Long-term: migrate components to use wagmi hooks directly and remove this store.
 */

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_CHAIN_ID } from '@/config/chains';
import type { ChainId } from '@/config/chains';

export const WALLET_STORAGE_KEY = 'propchain-wallet-state';
export const WALLET_STORE_VERSION = 1;
export const WALLET_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | null;

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType;
  chainId: ChainId;
  isConnecting: boolean;
  isSwitchingNetwork: boolean;
  error: string | null;
  balance: string | null;
  isLoading: boolean;
  lastUpdated: number | null;
}

export interface WalletActions {
  setConnected: (address: string, walletType: WalletType, chainId?: ChainId) => void;
  setDisconnected: () => void;
  setChainId: (chainId: ChainId) => void;
  setConnecting: (isConnecting: boolean) => void;
  setSwitchingNetwork: (isSwitching: boolean) => void;
  setError: (error: string | null) => void;
  setBalance: (balance: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
}

export type WalletStore = WalletState & WalletActions;

const storeCreator: StateCreator<WalletStore> = (set) => ({
  isConnected: false,
  address: null,
  walletType: null,
  chainId: DEFAULT_CHAIN_ID,
  isConnecting: false,
  isSwitchingNetwork: false,
  error: null,
  balance: null,
  isLoading: false,
  lastUpdated: null,

  setConnected: (address: string, walletType: WalletType, chainId: ChainId = DEFAULT_CHAIN_ID) => {
    set({
      isConnected: true,
      address,
      walletType,
      chainId,
      isConnecting: false,
      error: null,
      lastUpdated: Date.now(),
    });
  },

  setDisconnected: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(WALLET_STORAGE_KEY);
      } catch {
        // Ignore storage errors in restricted contexts
      }
    }
    set({
      isConnected: false,
      address: null,
      walletType: null,
      chainId: DEFAULT_CHAIN_ID,
      isConnecting: false,
      isSwitchingNetwork: false,
      error: null,
      balance: null,
      isLoading: false,
      lastUpdated: null,
    });
  },

  setChainId: (chainId: ChainId) => {
    set({ chainId, isSwitchingNetwork: false, error: null, lastUpdated: Date.now() });
  },

  setConnecting: (isConnecting: boolean) => {
    set({ isConnecting });
  },

  setSwitchingNetwork: (isSwitching: boolean) => {
    set({ isSwitchingNetwork: isSwitching });
  },

  setError: (error: string | null) => {
    set({ error, isConnecting: false, isSwitchingNetwork: false });
  },

  setBalance: (balance: string | null) => {
    set({ balance, lastUpdated: Date.now() });
  },

  clearError: () => {
    set({ error: null });
  },
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setLastUpdated: (timestamp: number) => set({ lastUpdated: timestamp }),
  
  reset: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(WALLET_STORAGE_KEY);
      } catch {
        // Ignore storage errors in restricted contexts
      }
    }
    set({
      isConnected: false,
      address: null,
      walletType: null,
      chainId: DEFAULT_CHAIN_ID,
      isConnecting: false,
      isSwitchingNetwork: false,
      error: null,
      balance: null,
      isLoading: false,
      lastUpdated: null,
    });
  },
});

export const createWalletStore = (shouldPersist = true) => {
  if (shouldPersist && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return create<WalletStore>()(
      persist(storeCreator, {
        name: WALLET_STORAGE_KEY,
        version: WALLET_STORE_VERSION,
        storage: {
          getItem: (name: string) => {
            try {
              const str = window.localStorage.getItem(name);
              return str ? JSON.parse(str) : null;
            } catch {
              return null;
            }
          },
          setItem: (name: string, value: unknown) => {
            try {
              const val = value as { state?: { isConnected?: boolean } } | null;
              if (!val?.state?.isConnected) {
                window.localStorage.removeItem(name);
              } else {
                window.localStorage.setItem(name, JSON.stringify(value));
              }
            } catch {
              // Ignore storage write errors
            }
          },
          removeItem: (name: string) => {
            try {
              window.localStorage.removeItem(name);
            } catch {
              // Ignore storage removal errors
            }
          },
        },
        partialize: (state) => ({
          isConnected: state.isConnected,
          address: state.address,
          walletType: state.walletType,
          chainId: state.chainId,
          lastUpdated: state.lastUpdated,
        }),
        migrate: (persistedState: unknown, version: number) => {
          if (version !== WALLET_STORE_VERSION || !persistedState) {
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                window.localStorage.removeItem(WALLET_STORAGE_KEY);
              } catch {
                // Ignore storage errors
              }
            }
            return {
              isConnected: false,
              address: null,
              walletType: null,
              chainId: DEFAULT_CHAIN_ID,
              lastUpdated: null,
            };
          }
          return persistedState;
        },
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          if (state.lastUpdated && Date.now() - state.lastUpdated > WALLET_SESSION_TTL_MS) {
            state.setDisconnected();
          }
        },
      })
    );
  }
  return create<WalletStore>()(storeCreator);
};

export const useWalletStore = createWalletStore(true);

