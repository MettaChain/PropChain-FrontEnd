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
  bridgeSuggestions: (address: string) => ["portfolio", "bridgeSuggestions", address] as const,
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
    onSuccess: (_, address) => {
      // Invalidate all portfolio queries for this address
      queryClient.invalidateQueries({ queryKey: ["portfolio", "multiChain", address] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", "performance", address] });
    },
    retry: 1,
  });
}

/**
 * Hook for getting bridge suggestions based on portfolio
 */
export function useBridgeSuggestionsQuery(address: string, enabled: boolean = true) {
  const portfolioQuery = useMultiChainPortfolioQuery(address, enabled);
  
  return useQuery({
    queryKey: portfolioQueryKeys.bridgeSuggestions(address),
    queryFn: () => {
      if (portfolioQuery.data) {
        return PortfolioService.calculateBridgeSuggestions(portfolioQuery.data);
      }
      return [];
    },
    enabled: enabled && !!address && !!portfolioQuery.data,
    staleTime: 1000 * 60 * 10, // 10 minutes for suggestions
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Combined hook for portfolio overview data
 */
export function usePortfolioOverview(address: string, enabled: boolean = true) {
  const portfolioQuery = useMultiChainPortfolioQuery(address, enabled);
  const performanceQuery = usePortfolioPerformanceQuery(address, 30, enabled);
  const gasPricesQuery = useGasPricesQuery();
  const bridgeSuggestionsQuery = useBridgeSuggestionsQuery(address, enabled);
  const refreshMutation = useRefreshPortfolioMutation();

  const isLoading = portfolioQuery.isLoading || performanceQuery.isLoading || gasPricesQuery.isLoading;
  const error = portfolioQuery.error || performanceQuery.error || gasPricesQuery.error;

  const handleRefresh = () => {
    if (address) {
      refreshMutation.mutate(address);
    }
  };

  return {
    // Portfolio data
    portfolio: portfolioQuery.data,
    performance: performanceQuery.data,
    gasPrices: gasPricesQuery.data,
    bridgeSuggestions: bridgeSuggestionsQuery.data,
    
    // Loading states
    isLoading,
    isRefreshing: refreshMutation.isPending,
    
    // Error handling
    error,
    
    // Actions
    refresh: handleRefresh,
    refetch: () => {
      portfolioQuery.refetch();
      performanceQuery.refetch();
      gasPricesQuery.refetch();
      bridgeSuggestionsQuery.refetch();
    },
  };
}
