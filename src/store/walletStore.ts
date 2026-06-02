import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CHAIN_ID } from '@/config/chains';
import type { ChainId } from '@/config/chains';

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
  /**
   * Sets the wallet as connected with the specified address and type.
   * 
   * @param address - The public wallet address.
   * @param walletType - The type of wallet used (e.g., 'metamask').
   * @param chainId - Optional chain ID the wallet is connected to.
   */
  setConnected: (address: string, walletType: WalletType, chainId?: ChainId) => void;

  /**
   * Disconnects the wallet and resets all connection state.
   */
  setDisconnected: () => void;

  /**
   * Updates the current chain ID.
   * 
   * @param chainId - The new chain ID.
   */
  setChainId: (chainId: ChainId) => void;

  /**
   * Sets the connecting state.
   * 
   * @param isConnecting - True if a connection is in progress.
   */
  setConnecting: (isConnecting: boolean) => void;

  /**
   * Sets the network switching state.
   * 
   * @param isSwitching - True if a network switch is in progress.
   */
  setSwitchingNetwork: (isSwitching: boolean) => void;

  /**
   * Sets the global wallet error message.
   * 
   * @param error - The error message or null to clear.
   */
  setError: (error: string | null) => void;

  /**
   * Updates the wallet balance.
   * 
   * @param balance - The new balance string.
   */
  setBalance: (balance: string | null) => void;

  /**
   * Clears the current wallet error.
   */
  clearError: () => void;

  /**
   * Sets the general loading state.
   * 
   * @param loading - True if loading.
   */
  setLoading: (loading: boolean) => void;

  /**
   * Updates the last synchronization timestamp.
   * 
   * @param timestamp - The numeric timestamp.
   */
  setLastUpdated: (timestamp: number) => void;

  /**
   * Resets the entire wallet store to initial state.
   */
  reset: () => void;
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
      
      reset: () => set({
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
      }),
    }),
    {
      name: 'propchain-wallet',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        walletType: state.walletType,
        chainId: state.chainId,
        isSwitchingNetwork: state.isSwitchingNetwork,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
