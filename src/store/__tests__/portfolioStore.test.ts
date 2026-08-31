import { act, renderHook, waitFor } from '@testing-library/react';
import { usePortfolioStore } from '../portfolioStore';
import type { MultiChainPortfolio, BridgeSuggestion } from '@/types/portfolio';

let mockWalletAddress: string | null = '0x1234...5678';

const mockFetchMultiChainPortfolio = jest.fn();
const mockCalculateBridgeSuggestions = jest.fn();

jest.mock('@/lib/portfolioService', () => ({
  PortfolioService: {
    fetchMultiChainPortfolio: (...args: unknown[]) =>
      mockFetchMultiChainPortfolio(...args),
    calculateBridgeSuggestions: (...args: unknown[]) =>
      mockCalculateBridgeSuggestions(...args),
  },
}));

jest.mock('../walletStore', () => ({
  useWalletStore: {
    getState: () => ({ address: mockWalletAddress }),
  },
}));

const mockPortfolio = (overrides: Partial<MultiChainPortfolio> = {}): MultiChainPortfolio => ({
  totalValueUSD: 500000,
  totalValueNative: new Map(),
  chains: [
    {
      chainId: 1,
      chainName: 'Ethereum',
      chainSymbol: 'ETH',
      chainColor: '#627EEA',
      totalValueUSD: 400000,
      totalValueNative: 150,
      gasBalance: '2.45',
      gasBalanceUSD: 6500,
      holdings: [
        {
          propertyId: 'prop-1',
          propertyName: 'Manhattan Apt',
          propertyImage: '/p.jpg',
          tokenSymbol: 'MLA',
          quantity: 150,
          valueUSD: 225000,
          valueNative: 85.5,
          chainId: 1,
          contractAddress: '0x1234',
          acquisitionDate: '2024-01-15',
          apy: 8.5,
        },
      ],
    },
  ],
  lastUpdated: '2024-01-01T00:00:00Z',
  isLoading: false,
  error: null,
  ...overrides,
});

const mockSuggestion: BridgeSuggestion = {
  fromChain: 137,
  toChain: 1,
  propertyId: 'prop-2',
  propertyName: 'Miami Condo',
  currentValue: 180000,
  potentialSavings: 3600,
  reason: 'Consolidate small holdings',
};

describe('portfolioStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletAddress = '0x1234...5678';
    usePortfolioStore.getState().clearPortfolio();
  });

  it('starts with no portfolio and default filters', () => {
    const { result } = renderHook(() => usePortfolioStore());
    expect(result.current.portfolio).toBeNull();
    expect(result.current.selectedChain).toBe('all');
    expect(result.current.bridgeSuggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastRefreshed).toBeNull();
  });

  it('loads the portfolio and derives bridge suggestions', async () => {
    const portfolio = mockPortfolio();
    mockFetchMultiChainPortfolio.mockResolvedValue(portfolio);
    mockCalculateBridgeSuggestions.mockReturnValue([mockSuggestion]);

    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.loadPortfolio('0x1234...5678');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchMultiChainPortfolio).toHaveBeenCalledWith('0x1234...5678');
    expect(mockCalculateBridgeSuggestions).toHaveBeenCalledWith(portfolio);
    expect(result.current.portfolio?.totalValueUSD).toBe(500000);
    expect(result.current.bridgeSuggestions).toEqual([mockSuggestion]);
    expect(result.current.lastRefreshed).not.toBeNull();
  });

  it('surfaces a portfolio-level error without throwing', async () => {
    mockFetchMultiChainPortfolio.mockResolvedValue(
      mockPortfolio({ error: 'Chain unavailable' }),
    );
    mockCalculateBridgeSuggestions.mockReturnValue([]);

    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.loadPortfolio('0x1234...5678');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.portfolio).not.toBeNull();
    expect(result.current.error).toBe('Chain unavailable');
  });

  it('handles a failed portfolio load', async () => {
    mockFetchMultiChainPortfolio.mockRejectedValue(new Error('RPC timeout'));

    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.loadPortfolio('0x1234...5678');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.portfolio).toBeNull();
    expect(result.current.error).toBe('RPC timeout');
  });

  it('refreshPortfolio errors when no wallet is connected', async () => {
    mockWalletAddress = null;

    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.refreshPortfolio();
    });

    expect(result.current.error).toBe('No wallet connected');
    expect(mockFetchMultiChainPortfolio).not.toHaveBeenCalled();
  });

  it('refreshPortfolio delegates to loadPortfolio with the connected address', async () => {
    mockFetchMultiChainPortfolio.mockResolvedValue(mockPortfolio());
    mockCalculateBridgeSuggestions.mockReturnValue([]);

    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.refreshPortfolio();
    });

    await waitFor(() => expect(result.current.portfolio).not.toBeNull());
    expect(mockFetchMultiChainPortfolio).toHaveBeenCalledWith('0x1234...5678');
  });

  it('sets the selected chain filter', () => {
    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.setSelectedChain(137);
    });

    expect(result.current.selectedChain).toBe(137);
  });

  it('clearPortfolio resets portfolio state', () => {
    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.setSelectedChain(137);
      result.current.clearPortfolio();
    });

    expect(result.current.portfolio).toBeNull();
    expect(result.current.bridgeSuggestions).toEqual([]);
    expect(result.current.selectedChain).toBe('all');
    expect(result.current.error).toBeNull();
    expect(result.current.lastRefreshed).toBeNull();
  });

  it('calculateBridgeSuggestions returns [] without a portfolio', () => {
    const { result } = renderHook(() => usePortfolioStore());
    expect(result.current.calculateBridgeSuggestions()).toEqual([]);
  });

  it('calculateBridgeSuggestions delegates to the service when loaded', () => {
    mockFetchMultiChainPortfolio.mockResolvedValue(mockPortfolio());
    mockCalculateBridgeSuggestions.mockReturnValue([mockSuggestion]);

    const { result } = renderHook(() => usePortfolioStore());

    act(() => {
      result.current.loadPortfolio('0x1234...5678');
    });

    act(() => {
      expect(result.current.calculateBridgeSuggestions()).toEqual([mockSuggestion]);
    });
  });
});
