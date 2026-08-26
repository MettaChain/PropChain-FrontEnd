import { renderHook, act } from '@testing-library/react';
import { useWalletConnector } from '../useWalletConnector';

jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/utils/errorHandling', () => ({
  getFriendlyWeb3ErrorMessage: jest.fn((err) => err?.message || 'Unknown error'),
}));

jest.mock('@/lib/walletConnectors/metamask', () => ({
  connectMetaMaskWallet: jest.fn(),
}));

jest.mock('@/lib/walletConnectors/coinbase', () => ({
  connectCoinbaseWallet: jest.fn(),
}));

jest.mock('@/lib/walletConnectors/walletconnect', () => ({
  connectWalletConnectWallet: jest.fn(),
}));

import { connectMetaMaskWallet } from '@/lib/walletConnectors/metamask';
import { connectCoinbaseWallet } from '@/lib/walletConnectors/coinbase';
import { connectWalletConnectWallet } from '@/lib/walletConnectors/walletconnect';

const mockMetaMask = connectMetaMaskWallet as jest.MockedFunction<typeof connectMetaMaskWallet>;
const mockCoinbase = connectCoinbaseWallet as jest.MockedFunction<typeof connectCoinbaseWallet>;
const mockWalletConnect = connectWalletConnectWallet as jest.MockedFunction<typeof connectWalletConnectWallet>;

describe('useWalletConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetaMask.mockResolvedValue({ address: '0x123', chainId: 1 });
    mockCoinbase.mockResolvedValue({ address: '0x456', chainId: 1 });
    mockWalletConnect.mockResolvedValue({ address: '0x789', chainId: 1 });
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useWalletConnector());
    expect(result.current.isLoadingConnector).toBe(false);
    expect(result.current.connectorError).toBeNull();
  });

  it('connects MetaMask successfully', async () => {
    const { result } = renderHook(() => useWalletConnector());

    let connectionResult;
    await act(async () => {
      connectionResult = await result.current.connectMetaMask();
    });

    expect(mockMetaMask).toHaveBeenCalled();
    expect(connectionResult).toEqual({ address: '0x123', chainId: 1 });
    expect(result.current.isLoadingConnector).toBe(false);
    expect(result.current.connectorError).toBeNull();
  });

  it('connects Coinbase successfully', async () => {
    const { result } = renderHook(() => useWalletConnector());

    let connectionResult;
    await act(async () => {
      connectionResult = await result.current.connectCoinbase();
    });

    expect(mockCoinbase).toHaveBeenCalled();
    expect(connectionResult).toEqual({ address: '0x456', chainId: 1 });
  });

  it('connects WalletConnect successfully', async () => {
    const { result } = renderHook(() => useWalletConnector());

    let connectionResult;
    await act(async () => {
      connectionResult = await result.current.connectWalletConnect();
    });

    expect(mockWalletConnect).toHaveBeenCalled();
    expect(connectionResult).toEqual({ address: '0x789', chainId: 1 });
  });

  it('sets error on MetaMask failure', async () => {
    mockMetaMask.mockRejectedValue(new Error('MetaMask not found'));

    const { result } = renderHook(() => useWalletConnector());

    await act(async () => {
      try {
        await result.current.connectMetaMask();
      } catch {}
    });

    expect(result.current.connectorError).toBe('MetaMask not found');
    expect(result.current.isLoadingConnector).toBe(false);
  });

  it('sets error on Coinbase failure', async () => {
    mockCoinbase.mockRejectedValue(new Error('Coinbase not found'));

    const { result } = renderHook(() => useWalletConnector());

    await act(async () => {
      try {
        await result.current.connectCoinbase();
      } catch {}
    });

    expect(result.current.connectorError).toBe('Coinbase not found');
  });

  it('connectWallet dispatches to correct connector', async () => {
    const { result } = renderHook(() => useWalletConnector());

    await act(async () => {
      await result.current.connectWallet('metamask');
    });

    expect(mockMetaMask).toHaveBeenCalled();

    await act(async () => {
      await result.current.connectWallet('coinbase');
    });

    expect(mockCoinbase).toHaveBeenCalled();

    await act(async () => {
      await result.current.connectWallet('walletconnect');
    });

    expect(mockWalletConnect).toHaveBeenCalled();
  });

  it('throws for unsupported wallet', async () => {
    const { result } = renderHook(() => useWalletConnector());

    await act(async () => {
      try {
        await result.current.connectWallet('unsupported' as any);
      } catch (e) {
        expect((e as Error).message).toBe('Unsupported wallet: unsupported');
      }
    });
  });

  it('clearError clears the error state', async () => {
    mockMetaMask.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useWalletConnector());

    await act(async () => {
      try {
        await result.current.connectMetaMask();
      } catch {}
    });

    expect(result.current.connectorError).toBe('Failed');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.connectorError).toBeNull();
  });
});
