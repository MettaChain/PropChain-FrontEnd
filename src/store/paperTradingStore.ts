import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaperPosition {
  propertyId: string;
  propertyName: string;
  tokensBought: number;
  avgBuyPrice: number; // price per token at purchase
  currentPrice: number; // latest market price per token
  purchasedAt: number; // timestamp
}

export interface PaperTransaction {
  id: string;
  type: 'buy' | 'sell';
  propertyId: string;
  propertyName: string;
  tokens: number;
  pricePerToken: number;
  total: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  startingBalance: number;
  currentBalance: number;
  totalReturn: number; // percentage
  rank: number;
}

const STARTING_BALANCE = 10_000;

interface PaperTradingState {
  isPaperMode: boolean;
  virtualBalance: number;
  positions: PaperPosition[];
  transactions: PaperTransaction[];
  leaderboard: LeaderboardEntry[];
}

interface PaperTradingActions {
  togglePaperMode: () => void;
  enablePaperMode: () => void;
  disablePaperMode: () => void;
  buyTokens: (propertyId: string, propertyName: string, tokens: number, pricePerToken: number) => { success: boolean; error?: string };
  sellTokens: (propertyId: string, tokens: number, pricePerToken: number) => { success: boolean; error?: string };
  updatePrice: (propertyId: string, currentPrice: number) => void;
  resetPortfolio: () => void;
  getPortfolioValue: () => number;
  getTotalReturn: () => number;
  getPositionPnL: (propertyId: string) => number;
}

export type PaperTradingStore = PaperTradingState & PaperTradingActions;

export const usePaperTradingStore = create<PaperTradingStore>()(
  persist(
    (set, get) => ({
      isPaperMode: false,
      virtualBalance: STARTING_BALANCE,
      positions: [],
      transactions: [],
      leaderboard: [],

      togglePaperMode: () => set((s) => ({ isPaperMode: !s.isPaperMode })),
      enablePaperMode: () => set({ isPaperMode: true }),
      disablePaperMode: () => set({ isPaperMode: false }),

      buyTokens: (propertyId, propertyName, tokens, pricePerToken) => {
        const { virtualBalance, positions } = get();
        const cost = tokens * pricePerToken;

        if (cost > virtualBalance) {
          return { success: false, error: 'Insufficient virtual balance' };
        }
        if (tokens <= 0) {
          return { success: false, error: 'Token amount must be positive' };
        }

        const tx: PaperTransaction = {
          id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'buy',
          propertyId,
          propertyName,
          tokens,
          pricePerToken,
          total: cost,
          timestamp: Date.now(),
        };

        const existing = positions.find((p) => p.propertyId === propertyId);
        let updatedPositions: PaperPosition[];

        if (existing) {
          const totalTokens = existing.tokensBought + tokens;
          const avgPrice = (existing.avgBuyPrice * existing.tokensBought + pricePerToken * tokens) / totalTokens;
          updatedPositions = positions.map((p) =>
            p.propertyId === propertyId
              ? { ...p, tokensBought: totalTokens, avgBuyPrice: avgPrice, currentPrice: pricePerToken }
              : p
          );
        } else {
          updatedPositions = [
            ...positions,
            { propertyId, propertyName, tokensBought: tokens, avgBuyPrice: pricePerToken, currentPrice: pricePerToken, purchasedAt: Date.now() },
          ];
        }

        set((s) => ({
          virtualBalance: s.virtualBalance - cost,
          positions: updatedPositions,
          transactions: [tx, ...s.transactions],
        }));

        return { success: true };
      },

      sellTokens: (propertyId, tokens, pricePerToken) => {
        const { positions } = get();
        const position = positions.find((p) => p.propertyId === propertyId);

        if (!position) return { success: false, error: 'No position found for this property' };
        if (tokens > position.tokensBought) return { success: false, error: 'Cannot sell more tokens than owned' };
        if (tokens <= 0) return { success: false, error: 'Token amount must be positive' };

        const proceeds = tokens * pricePerToken;
        const tx: PaperTransaction = {
          id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'sell',
          propertyId,
          propertyName: position.propertyName,
          tokens,
          pricePerToken,
          total: proceeds,
          timestamp: Date.now(),
        };

        const remaining = position.tokensBought - tokens;
        const updatedPositions =
          remaining === 0
            ? positions.filter((p) => p.propertyId !== propertyId)
            : positions.map((p) => (p.propertyId === propertyId ? { ...p, tokensBought: remaining, currentPrice: pricePerToken } : p));

        set((s) => ({
          virtualBalance: s.virtualBalance + proceeds,
          positions: updatedPositions,
          transactions: [tx, ...s.transactions],
        }));

        return { success: true };
      },

      updatePrice: (propertyId, currentPrice) => {
        set((s) => ({
          positions: s.positions.map((p) => (p.propertyId === propertyId ? { ...p, currentPrice } : p)),
        }));
      },

      resetPortfolio: () =>
        set({
          virtualBalance: STARTING_BALANCE,
          positions: [],
          transactions: [],
        }),

      getPortfolioValue: () => {
        const { positions } = get();
        return positions.reduce((sum, p) => sum + p.tokensBought * p.currentPrice, 0);
      },

      getTotalReturn: () => {
        const { virtualBalance } = get();
        const portfolioValue = get().getPortfolioValue();
        const total = virtualBalance + portfolioValue;
        return ((total - STARTING_BALANCE) / STARTING_BALANCE) * 100;
      },

      getPositionPnL: (propertyId) => {
        const position = get().positions.find((p) => p.propertyId === propertyId);
        if (!position) return 0;
        return (position.currentPrice - position.avgBuyPrice) * position.tokensBought;
      },
    }),
    {
      name: 'propchain-paper-trading',
    }
  )
);
