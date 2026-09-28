import { act } from '@testing-library/react';
import {
  createWalletStore,
  useWalletStore,
  WALLET_STORAGE_KEY,
  WALLET_STORE_VERSION,
  WALLET_SESSION_TTL_MS,
} from '../walletStore';

jest.mock('@/config/chains', () => ({
  DEFAULT_CHAIN_ID: 1,
  CHAIN_IDS: { ETHEREUM: 1, POLYGON: 137, BSC: 56, FOUNDRY: 31337 },
}));

describe('WalletPersistence and restore behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    useWalletStore.getState().reset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('persist on connect', () => {
    it('persists connected wallet state and metadata to localStorage', () => {
      const store = createWalletStore(true);

      act(() => {
        store.getState().setConnected('0x1234567890123456789012345678901234567890', 'metamask', 137);
      });

      const raw = localStorage.getItem(WALLET_STORAGE_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(WALLET_STORE_VERSION);
      expect(parsed.state.isConnected).toBe(true);
      expect(parsed.state.address).toBe('0x1234567890123456789012345678901234567890');
      expect(parsed.state.walletType).toBe('metamask');
      expect(parsed.state.chainId).toBe(137);
      expect(typeof parsed.state.lastUpdated).toBe('number');
    });

    it('persists account switch when connecting with a different address', () => {
      const store = createWalletStore(true);

      act(() => {
        store.getState().setConnected('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'metamask', 1);
      });

      let raw = localStorage.getItem(WALLET_STORAGE_KEY);
      expect(JSON.parse(raw!).state.address).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

      act(() => {
        store.getState().setConnected('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'metamask', 1);
      });

      raw = localStorage.getItem(WALLET_STORAGE_KEY);
      expect(JSON.parse(raw!).state.address).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    });
  });

  describe('restore on init', () => {
    it('restores connected state from localStorage across reload/re-init', () => {
      const existingState = {
        state: {
          isConnected: true,
          address: '0x1111111111111111111111111111111111111111',
          walletType: 'walletconnect',
          chainId: 56,
          lastUpdated: Date.now(),
        },
        version: WALLET_STORE_VERSION,
      };
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(existingState));

      const newStore = createWalletStore(true);
      const state = newStore.getState();

      expect(state.isConnected).toBe(true);
      expect(state.address).toBe('0x1111111111111111111111111111111111111111');
      expect(state.walletType).toBe('walletconnect');
      expect(state.chainId).toBe(56);
    });

    it('clears state on init if session has expired beyond TTL', () => {
      const expiredTimestamp = Date.now() - (WALLET_SESSION_TTL_MS + 60000); // Expired 1 min ago
      const expiredState = {
        state: {
          isConnected: true,
          address: '0xexpired111111111111111111111111111111111',
          walletType: 'metamask',
          chainId: 1,
          lastUpdated: expiredTimestamp,
        },
        version: WALLET_STORE_VERSION,
      };
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(expiredState));

      const newStore = createWalletStore(true);
      const state = newStore.getState();

      expect(state.isConnected).toBe(false);
      expect(state.address).toBeNull();
    });
  });

  describe('version and compatibility failure handling', () => {
    it('resets state and clears storage if version mismatch is encountered', () => {
      const outdatedState = {
        state: {
          isConnected: true,
          address: '0xoldversion111111111111111111111111111111',
          walletType: 'metamask',
          chainId: 1,
          lastUpdated: Date.now(),
        },
        version: 999, // Incompatible version
      };
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(outdatedState));

      const newStore = createWalletStore(true);
      const state = newStore.getState();

      expect(state.isConnected).toBe(false);
      expect(state.address).toBeNull();
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).toBeNull();
    });

    it('handles corrupted JSON payload in localStorage gracefully', () => {
      localStorage.setItem(WALLET_STORAGE_KEY, 'not-valid-json{[[[');

      expect(() => {
        const store = createWalletStore(true);
        expect(store.getState().isConnected).toBe(false);
      }).not.toThrow();
    });
  });

  describe('disconnect and clear paths', () => {
    it('clears storage item on setDisconnected', () => {
      const store = createWalletStore(true);

      act(() => {
        store.getState().setConnected('0x1234567890123456789012345678901234567890', 'metamask');
      });
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).not.toBeNull();

      act(() => {
        store.getState().setDisconnected();
      });

      expect(store.getState().isConnected).toBe(false);
      expect(store.getState().address).toBeNull();
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).toBeNull();
    });

    it('clears storage item on reset', () => {
      const store = createWalletStore(true);

      act(() => {
        store.getState().setConnected('0x1234567890123456789012345678901234567890', 'metamask');
      });
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).not.toBeNull();

      act(() => {
        store.getState().reset();
      });

      expect(store.getState().isConnected).toBe(false);
      expect(store.getState().address).toBeNull();
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).toBeNull();
    });
  });
});
