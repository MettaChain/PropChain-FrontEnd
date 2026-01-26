import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChainId, DEFAULT_CHAIN_ID } from '@/config/chains';

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
}

export type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      walletType: null,
      chainId: DEFAULT_CHAIN_ID,
      isConnecting: false,
      isSwitchingNetwork: false,
      error: null,
      balance: null,

      setConnected: (address: string, walletType: WalletType, chainId: ChainId = DEFAULT_CHAIN_ID) => {
        set({
          isConnected: true,
          address,
          walletType,
          chainId,
          isConnecting: false,
          error: null,
        });
      },

      setDisconnected: () => {
        set({
          isConnected: false,
          address: null,
          walletType: null,
          chainId: DEFAULT_CHAIN_ID,
          isConnecting: false,
          isSwitchingNetwork: false,
          error: null,
          balance: null,
        });
      },

      setChainId: (chainId: ChainId) => {
        set({ chainId, isSwitchingNetwork: false, error: null });
      },

      setConnecting: (isConnecting: boolean) => {
        set({ isConnecting });
      },

      setSwitchingNetwork: (isSwitching: boolean) => {
        set({ isSwitchingNetwork: isSwitching });
      }

      setError: (error: string | null) => {
        set({ error, isConnecting: false, isSwitchingNetwork: false });
      },

      setBalance: (balance: string | null) => {
        set({ balance });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'propchain-wallet',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        walletType: state.walletType,
        chainId: state.chainId,
        isSwitchingNetwork: state.isSwitchingNetwork,
      }),
    }
  )
);
