import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortfolioService } from "@/lib/portfolioService";
import type { MultiChainPortfolio, BridgeSuggestion } from "@/types/portfolio";
import type { ChainId } from "@/config/chains";

/**
 * Query key factory for portfolio queries
 */
export const portfolioQueryKeys = {
  all: ["portfolio"] as const,
  multiChain: (address: string) => ["portfolio", "multiChain", address] as const,
  performance: (address: string, days: number) => ["portfolio", "performance", address, days] as const,
  gasPrices: () => ["portfolio", "gasPrices"] as const,
};

/**
 * Hook for fetching multi-chain portfolio data
 */
export function useMultiChainPortfolioQuery(address: string, enabled: boolean = true) {
  return useQuery({
    queryKey: portfolioQueryKeys.multiChain(address),
    queryFn: () => PortfolioService.fetchMultiChainPortfolio(address),
    enabled: enabled && !!address,
    staleTime: 1000 * 60 * 2, // 2 minutes for portfolio data
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for fetching portfolio performance data
 */
export function usePortfolioPerformanceQuery(address: string, days: number = 30, enabled: boolean = true) {
  return useQuery({
    queryKey: portfolioQueryKeys.performance(address, days),
    queryFn: () => PortfolioService.getPortfolioPerformance(address, days),
    enabled: enabled && !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes for performance data
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for fetching gas prices
 */
export function useGasPricesQuery() {
  return useQuery({
    queryKey: portfolioQueryKeys.gasPrices(),
    queryFn: () => PortfolioService.getGasPrices(),
    staleTime: 1000 * 60 * 1, // 1 minute for gas prices
    gcTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}

/**
 * Hook for refreshing portfolio data
 */
export function useRefreshPortfolioMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address: string) => PortfolioService.refreshPortfolio(address),
    onSuccess: (_) => {
      // Invalidate every portfolio query at once. `portfolioQueryKeys.all`
      // (the prefix `["portfolio"]`) is a superset match in @tanstack/react-
      // query, so this purges `multiChain`, `performance`, `gasPrices`, and
      // the new `overview` key introduced by #504. Callers of
      // `usePortfolioOverview.refresh()` therefore see fresh data on next
      // render rather than waiting out the cached `staleTime` window.
      queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.all });
    },
    retry: 1,
  });
}

/**
 * Combined hook for portfolio overview data.
 *
 * Issues the portfolio, performance and gas-price fetches in parallel via
 * `Promise.all` inside `PortfolioService.fetchPortfolioOverview`, eliminating
 * the sequential waterfall that arose from waiting on `portfolioQuery.data`
 * before triggering bridge-suggestions (#504).
 */
export function usePortfolioOverviewQuery(
  address: string,
  days: number = 30,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...portfolioQueryKeys.all, 'overview', address, days] as const,
    queryFn: () => PortfolioService.fetchPortfolioOverview(address, days),
    enabled: enabled && !!address,
    // Align on the portfolio slice's prior freshness window (2 minutes):
    // gas prices cached shorter previously, but the overview is a coalesced
    // unit so reusing the portfolio window avoids 2x fetches per minute
    // while still being much faster than the previous bridge-suggestions
    // 10-minute window.
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Combined hook for portfolio overview data (legacy).
 *
 * Kept for compatibility with callers that haven't migrated to
 * `usePortfolioOverviewQuery`. Internally delegates to the parallel fetcher.
 */
export function usePortfolioOverview(address: string, enabled: boolean = true) {
  const overviewQuery = usePortfolioOverviewQuery(address, 30, enabled);
  const refreshMutation = useRefreshPortfolioMutation();

  const handleRefresh = () => {
    if (address) {
      refreshMutation.mutate(address);
    }
  };

  return {
    // Portfolio data
    portfolio: overviewQuery.data?.portfolio,
    performance: overviewQuery.data?.performance,
    gasPrices: overviewQuery.data?.gasPrices,
    bridgeSuggestions: overviewQuery.data?.bridgeSuggestions,

    // Loading states
    isLoading: overviewQuery.isLoading,
    isRefreshing: refreshMutation.isPending,

    // Error handling
    error: overviewQuery.error,

    // Actions
    refresh: handleRefresh,
    refetch: overviewQuery.refetch,
  };
}
