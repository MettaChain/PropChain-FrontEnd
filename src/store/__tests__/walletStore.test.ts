import { act, renderHook } from '@testing-library/react';
import { useWalletStore } from '../walletStore';

describe('walletStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useWalletStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useWalletStore());
      
      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.walletType).toBeNull();
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isSwitchingNetwork).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.balance).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('setConnected', () => {
    it('should set wallet as connected', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'metamask', 1);
      });
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
      expect(result.current.walletType).toBe('metamask');
      expect(result.current.chainId).toBe(1);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should use default chain ID when not provided', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'walletconnect');
      });
      
      expect(result.current.chainId).toBe(1); // DEFAULT_CHAIN_ID
    });
  });

  describe('setDisconnected', () => {
    it('should set wallet as disconnected', () => {
      const { result } = renderHook(() => useWalletStore());
      
      // First connect
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'metamask');
      });
      
      // Then disconnect
      act(() => {
        result.current.setDisconnected();
      });
      
      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.walletType).toBeNull();
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isSwitchingNetwork).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.balance).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('setChainId', () => {
    it('should update chain ID', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'metamask');
        result.current.setChainId(137); // Polygon
      });
      
      expect(result.current.chainId).toBe(137);
      expect(result.current.isSwitchingNetwork).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setConnecting', () => {
    it('should update connecting state', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnecting(true);
      });
      
      expect(result.current.isConnecting).toBe(true);
      
      act(() => {
        result.current.setConnecting(false);
      });
      
      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('setSwitchingNetwork', () => {
    it('should update network switching state', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setSwitchingNetwork(true);
      });
      
      expect(result.current.isSwitchingNetwork).toBe(true);
      
      act(() => {
        result.current.setSwitchingNetwork(false);
      });
      
      expect(result.current.isSwitchingNetwork).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error and reset connection states', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnecting(true);
        result.current.setSwitchingNetwork(true);
        result.current.setError('Connection failed');
      });
      
      expect(result.current.error).toBe('Connection failed');
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isSwitchingNetwork).toBe(false);
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setError('Some error');
      });
      
      expect(result.current.error).toBe('Some error');
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setBalance', () => {
    it('should update balance', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setBalance('1.5');
      });
      
      expect(result.current.balance).toBe('1.5');
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should clear balance when set to null', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setBalance('1.5');
        result.current.setBalance(null);
      });
      
      expect(result.current.balance).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setError('Some error');
      });
      
      expect(result.current.error).toBe('Some error');
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setLastUpdated', () => {
    it('should update last updated timestamp', () => {
      const { result } = renderHook(() => useWalletStore());
      
      const timestamp = Date.now();
      
      act(() => {
        result.current.setLastUpdated(timestamp);
      });
      
      expect(result.current.lastUpdated).toBe(timestamp);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useWalletStore());
      
      // Set some state
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'metamask');
        result.current.setBalance('2.5');
        result.current.setError('Some error');
        result.current.setLoading(true);
        result.current.setConnecting(true);
        result.current.setSwitchingNetwork(true);
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.walletType).toBeNull();
      expect(result.current.chainId).toBe(1); // DEFAULT_CHAIN_ID
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isSwitchingNetwork).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.balance).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist connection state', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'metamask', 137);
      });
      
      // Create a new hook instance to test persistence
      const { result: result2 } = renderHook(() => useWalletStore());
      
      expect(result2.current.isConnected).toBe(true);
      expect(result2.current.address).toBe('0x1234567890123456789012345678901234567890');
      expect(result2.current.walletType).toBe('metamask');
      expect(result2.current.chainId).toBe(137);
    });

    it('should not persist sensitive data like balance', () => {
      const { result } = renderHook(() => useWalletStore());
      
      act(() => {
        result.current.setConnected('0x1234567890123456789012345678901234567890', 'metamask');
        result.current.setBalance('5.0');
      });
      
      // Create a new hook instance
      const { result: result2 } = renderHook(() => useWalletStore());
      
      expect(result2.current.balance).toBeNull(); // Balance should not be persisted
    });
  });
});
