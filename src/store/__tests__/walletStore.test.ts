import { act, renderHook } from '@testing-library/react';
import { useWalletStore } from '../walletStore';
import { DEFAULT_CHAIN_ID } from '@/config/chains';

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.getState().reset();
  });

  it('has the correct initial state', () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.walletType).toBeNull();
    expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isSwitchingNetwork).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.balance).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
  });

  it('connects a wallet with address, type and chain', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setConnected('0x1234...5678', 'metamask', 137);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('0x1234...5678');
    expect(result.current.walletType).toBe('metamask');
    expect(result.current.chainId).toBe(137);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeGreaterThan(0);
  });

  it('defaults the chain to the default chain id when connecting', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setConnected('0x1234...5678', 'walletconnect');
    });

    expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
  });

  it('switches the network chain id', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setConnected('0x1234...5678', 'metamask');
      result.current.setChainId(56);
    });

    expect(result.current.chainId).toBe(56);
    expect(result.current.isSwitchingNetwork).toBe(false);
  });

  it('disconnects and fully resets connection state', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setConnected('0x1234...5678', 'coinbase', 137);
      result.current.setBalance('2.5');
      result.current.setLoading(true);
      result.current.setDisconnected();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.walletType).toBeNull();
    expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
    expect(result.current.balance).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
  });

  it('tracks connecting state', () => {
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

  it('tracks switching network state', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setSwitchingNetwork(true);
    });
    expect(result.current.isSwitchingNetwork).toBe(true);
  });

  it('sets and clears errors', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setError('User rejected request');
    });
    expect(result.current.error).toBe('User rejected request');
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isSwitchingNetwork).toBe(false);

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it('sets the balance', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setBalance('3.75');
    });

    expect(result.current.balance).toBe('3.75');
    expect(result.current.lastUpdated).toBeGreaterThan(0);
  });

  it('tracks loading and last updated', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setLoading(true);
      result.current.setLastUpdated(12345);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.lastUpdated).toBe(12345);
  });

  it('resets to the initial state', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setConnected('0x1234...5678', 'metamask');
      result.current.setError('boom');
      result.current.reset();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.walletType).toBeNull();
    expect(result.current.chainId).toBe(DEFAULT_CHAIN_ID);
    expect(result.current.error).toBeNull();
    expect(result.current.balance).toBeNull();
  });
});
