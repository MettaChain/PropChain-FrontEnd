import { renderHook, act, waitFor } from '@testing-library/react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useCurrencyConverter', () => {
  const mockEthPrice = 3456.78;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('starts with loading true and null rate', () => {
      // Don't resolve fetch so we can inspect initial state
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCurrencyConverter());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.ethToUsdRate).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('Successful Rate Fetch', () => {
    it('fetches and sets the ETH/USD rate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: mockEthPrice } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBe(mockEthPrice);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('saves rate to localStorage after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: mockEthPrice } }),
      });

      renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(localStorage.getItem('ethToUsdRate')).toBe(mockEthPrice.toString());
      });

      expect(localStorage.getItem('ethToUsdLastUpdated')).toBeTruthy();
    });
  });

  describe('HTTP Error Handling', () => {
    it('handles non-ok HTTP responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toContain('HTTP error');
      expect(result.current.error).toContain('429');
    });
  });

  describe('Network Error / Fetch Failure', () => {
    it('handles network fetch failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('NetworkError'));

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('NetworkError');
    });

    it('falls back to cached rate on network error when localStorage has data', async () => {
      // Pre-seed localStorage with cached data
      localStorage.setItem('ethToUsdRate', mockEthPrice.toString());
      localStorage.setItem('ethToUsdLastUpdated', new Date().toISOString());

      mockFetch.mockRejectedValueOnce(new Error('NetworkError'));

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use cached rate on failure
      expect(result.current.ethToUsdRate).toBe(mockEthPrice);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('throws error with no cache on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('No internet connection'));

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('No internet connection');
      expect(result.current.ethToUsdRate).toBeNull();
    });
  });

  describe('Caching / Stale Data', () => {
    it('uses cached rate when less than 60 seconds old', async () => {
      // Pre-seed localStorage with recent cached data
      localStorage.setItem('ethToUsdRate', mockEthPrice.toString());
      const recentDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      localStorage.setItem('ethToUsdLastUpdated', recentDate.toISOString());

      const { result } = renderHook(() => useCurrencyConverter());

      // Should immediately use cached data without fetching
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBe(mockEthPrice);
      expect(result.current.lastUpdated).toEqual(recentDate);
      // fetch should NOT have been called because cache is fresh
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches fresh data when cache is older than 60 seconds', async () => {
      // Pre-seed localStorage with stale cached data
      localStorage.setItem('ethToUsdRate', '3000');
      const staleDate = new Date(Date.now() - 120 * 1000); // 120 seconds ago
      localStorage.setItem('ethToUsdLastUpdated', staleDate.toISOString());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: mockEthPrice } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have fetched and updated to the new rate
      expect(result.current.ethToUsdRate).toBe(mockEthPrice);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Storage Re-hydration', () => {
    it('re-hydrates rate from localStorage on mount', async () => {
      const cachedRate = 2500.50;
      const cachedDate = new Date(Date.now() - 30 * 1000).toISOString();
      localStorage.setItem('ethToUsdRate', cachedRate.toString());
      localStorage.setItem('ethToUsdLastUpdated', cachedDate);

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBe(cachedRate);
      expect(result.current.lastUpdated).toEqual(new Date(cachedDate));
    });

    it('handles missing cached date gracefully', async () => {
      localStorage.setItem('ethToUsdRate', '2000');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: mockEthPrice } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fetch fresh data since no valid cache date
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Conversion Functions', () => {
    it('convertEthToUsd converts ETH to USD correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: 3000 } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.convertEthToUsd(2)).toBe(6000);
      expect(result.current.convertEthToUsd(0.5)).toBe(1500);
      expect(result.current.convertEthToUsd(0)).toBe(0);
    });

    it('convertEthToUsd returns null when rate is null', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCurrencyConverter());

      expect(result.current.convertEthToUsd(1)).toBeNull();
    });

    it('formatEthPrice formats ETH amount correctly', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCurrencyConverter());

      expect(result.current.formatEthPrice(1.5)).toBe('1.5000 ETH');
      expect(result.current.formatEthPrice(2)).toBe('2.0000 ETH');
    });

    it('formatUsdPrice formats USD amount correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: 3000 } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.formatUsdPrice(1)).toBe('$3,000.00');
    });

    it('formatUsdPrice returns null when rate is null', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCurrencyConverter());

      expect(result.current.formatUsdPrice(1)).toBeNull();
    });
  });

  describe('Refetch Functionality', () => {
    it('refetch triggers a new fetch and updates the rate', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ethereum: { usd: 3000 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ethereum: { usd: 3500 } }),
        });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBe(3000);

      // Manually refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.ethToUsdRate).toBe(3500);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('refetch handles errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ethereum: { usd: 3000 } }),
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBe(3000);

      await act(async () => {
        await result.current.refetch();
      });

      // Should keep previous rate on refetch failure
      expect(result.current.ethToUsdRate).toBe(3000);
      expect(result.current.error).toBe('Refetch failed');
    });
  });

  describe('Auto-refresh Interval', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ethereum: { usd: mockEthPrice } }),
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sets up an interval for auto-refresh', () => {
      renderHook(() => useCurrencyConverter());

      // Fast-forward 60 seconds
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Should have triggered a second fetch
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('clears interval on unmount', () => {
      const { unmount } = renderHook(() => useCurrencyConverter());
      unmount();

      act(() => {
        jest.advanceTimersByTime(120000);
      });

      // Should only have the initial fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles response without ethereum.usd', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: {} }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBeNull();
    });

    it('handles response with null usd value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: null } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBeNull();
    });

    it('handles response with undefined usd value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: undefined } }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBeNull();
    });

    it('handles completely malformed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'data' }),
      });

      const { result } = renderHook(() => useCurrencyConverter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ethToUsdRate).toBeNull();
    });
  });
});
