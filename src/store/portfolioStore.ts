import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioState, PortfolioActions, MultiChainPortfolio, PortfolioFilter, BridgeSuggestion } from '@/types/portfolio';
import { PortfolioService } from '@/lib/portfolioService';
import { useWalletStore } from './walletStore';

interface PortfolioStore extends PortfolioState, PortfolioActions {}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      portfolio: null,
      selectedChain: 'all',
      bridgeSuggestions: [],
      isLoading: false,
      error: null,
      lastRefreshed: null,

      loadPortfolio: async (address: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const portfolio = await PortfolioService.fetchMultiChainPortfolio(address);
          const bridgeSuggestions = PortfolioService.calculateBridgeSuggestions(portfolio);
          
          set({
            portfolio,
            bridgeSuggestions,
            isLoading: false,
            lastRefreshed: Date.now(),
            error: portfolio.error
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load portfolio'
          });
        }
      },

      refreshPortfolio: async () => {
        const { address } = useWalletStore.getState();
        if (!address) {
          set({ error: 'No wallet connected' });
          return;
        }

        await get().loadPortfolio(address);
      },

      setSelectedChain: (chain: PortfolioFilter) => {
        set({ selectedChain: chain });
      },

      clearPortfolio: () => {
        set({
          portfolio: null,
          bridgeSuggestions: [],
          selectedChain: 'all',
          error: null,
          lastRefreshed: null
        });
      },

      calculateBridgeSuggestions: () => {
        const { portfolio } = get();
        if (!portfolio) return [];
        
        return PortfolioService.calculateBridgeSuggestions(portfolio);
      },
    }),
    {
      name: 'propchain-portfolio',
      partialize: (state) => ({
        selectedChain: state.selectedChain,
        lastRefreshed: state.lastRefreshed,
      }),
    }
  )
);
