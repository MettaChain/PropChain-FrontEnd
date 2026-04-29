import type { ChainId } from '@/config/chains';

export interface TokenHolding {
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  tokenSymbol: string;
  quantity: number;
  valueUSD: number;
  valueNative: number;
  chainId: ChainId;
  contractAddress: string;
  acquisitionDate: string;
  apy?: number;
}

export interface ChainPortfolio {
  chainId: ChainId;
  chainName: string;
  chainSymbol: string;
  chainColor: string;
  totalValueUSD: number;
  totalValueNative: number;
  gasBalance: string;
  gasBalanceUSD: number;
  holdings: TokenHolding[];
}

export interface MultiChainPortfolio {
  totalValueUSD: number;
  totalValueNative: Map<ChainId, number>;
  chains: ChainPortfolio[];
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}

export interface BridgeSuggestion {
  fromChain: ChainId;
  toChain: ChainId;
  propertyId: string;
  propertyName: string;
  currentValue: number;
  potentialSavings: number;
  reason: string;
}

export type PortfolioFilter = 'all' | ChainId;

export interface PortfolioState {
  portfolio: MultiChainPortfolio | null;
  selectedChain: PortfolioFilter;
  bridgeSuggestions: BridgeSuggestion[];
  isLoading: boolean;
  error: string | null;
  lastRefreshed: number | null;
}

export interface PortfolioActions {
  loadPortfolio: (address: string) => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  setSelectedChain: (chain: PortfolioFilter) => void;
  clearPortfolio: () => void;
  calculateBridgeSuggestions: () => BridgeSuggestion[];
}
