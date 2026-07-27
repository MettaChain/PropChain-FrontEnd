/**
 * @jest-environment jsdom
 *
 * #504: usePortfolioOverviewQuery must call PortfolioService.fetchPortfolioOverview
 * (which fans out via Promise.all) under the hood, replacing the previous
 * sequential waterfall driven by bridgeSuggestions waiting on the portfolio
 * data via the `enabled` flag.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { PortfolioService } from '@/lib/portfolioService';
import { usePortfolioOverviewQuery } from '@/hooks/usePortfolioQuery';

jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const makeWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
};

describe('usePortfolioOverviewQuery (#504)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the parallel PortfolioService.fetchPortfolioOverview on resolve', async () => {
    const overviewSpy = jest
      .spyOn(PortfolioService, 'fetchPortfolioOverview')
      .mockResolvedValue({
        portfolio: {
          totalValueUSD: 42,
          totalValueNative: new Map(),
          chains: [],
          lastUpdated: 'now',
          isLoading: false,
          error: null,
        },
        performance: [{ date: '2026-06-01', value: 42 }],
        gasPrices: {} as never,
        bridgeSuggestions: [],
      });

    const { result } = renderHook(
      () => usePortfolioOverviewQuery('0xabc', 30, true),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(overviewSpy).toHaveBeenCalledWith('0xabc', 30);
    expect(result.current.data?.portfolio.totalValueUSD).toBe(42);
  });

  it('does not fetch when the hook is disabled', async () => {
    const overviewSpy = jest
      .spyOn(PortfolioService, 'fetchPortfolioOverview')
      .mockResolvedValue({
        portfolio: {
          totalValueUSD: 0,
          totalValueNative: new Map(),
          chains: [],
          lastUpdated: 'now',
          isLoading: false,
          error: null,
        },
        performance: [],
        gasPrices: {} as never,
        bridgeSuggestions: [],
      });

    const { result } = renderHook(
      () => usePortfolioOverviewQuery('0xabc', 30, false),
      { wrapper: makeWrapper() }
    );

    // Disabled hooks should report `idle` fetch status synchronously and
    // must never call the queryFn. Use waitFor with `expect.assertions`
    // semantics to avoid race conditions on the tick boundary.
    expect(overviewSpy).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();

    await waitFor(
      () => {
        expect(overviewSpy).not.toHaveBeenCalled();
      },
      { timeout: 50 }
    );
  });
});
