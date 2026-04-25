import { CHAIN_CONFIG, type ChainId } from '@/config/chains';
import type { TokenHolding, ChainPortfolio, MultiChainPortfolio, BridgeSuggestion } from '@/types/portfolio';
import { logger } from '@/utils/logger';

// Mock data for demonstration - in production, this would fetch from blockchain APIs
const MOCK_TOKEN_HOLDINGS: Record<ChainId, TokenHolding[]> = {
  1: [ // Ethereum
    {
      propertyId: 'prop-1',
      propertyName: 'Manhattan Luxury Apartment',
      propertyImage: '/properties/manhattan-apt.jpg',
      tokenSymbol: 'MLA',
      quantity: 150,
      valueUSD: 225000,
      valueNative: 85.5,
      chainId: 1,
      contractAddress: '0x1234...5678',
      acquisitionDate: '2024-01-15',
      apy: 8.5
    },
    {
      propertyId: 'prop-2',
      propertyName: 'Brooklyn Townhouse',
      propertyImage: '/properties/brooklyn-house.jpg',
      tokenSymbol: 'BTH',
      quantity: 75,
      valueUSD: 112500,
      valueNative: 42.7,
      chainId: 1,
      contractAddress: '0x8765...4321',
      acquisitionDate: '2024-02-20',
      apy: 7.2
    }
  ],
  137: [ // Polygon
    {
      propertyId: 'prop-3',
      propertyName: 'Miami Beach Condo',
      propertyImage: '/properties/miami-condo.jpg',
      tokenSymbol: 'MBC',
      quantity: 200,
      valueUSD: 180000,
      valueNative: 98000,
      chainId: 137,
      contractAddress: '0x9876...1234',
      acquisitionDate: '2024-03-10',
      apy: 9.1
    }
  ],
  56: [ // BSC
    {
      propertyId: 'prop-4',
      propertyName: 'Austin Commercial Space',
      propertyImage: '/properties/austin-office.jpg',
      tokenSymbol: 'ACS',
      quantity: 50,
      valueUSD: 75000,
      valueNative: 135,
      chainId: 56,
      contractAddress: '0x5432...8765',
      acquisitionDate: '2024-01-25',
      apy: 6.8
    }
  ]
};

// Mock gas balances
const MOCK_GAS_BALANCES: Record<ChainId, { balance: string; balanceUSD: number }> = {
  1: { balance: '2.45', balanceUSD: 6500 },
  137: { balance: '8500', balanceUSD: 7650 },
  56: { balance: '3.2', balanceUSD: 1920 }
};

export class PortfolioService {
  /**
   * Fetch portfolio data for a given wallet address across all chains
   */
  static async fetchMultiChainPortfolio(address: string): Promise<MultiChainPortfolio> {
    try {
      logger.info('Fetching multi-chain portfolio', { address });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const chains: ChainPortfolio[] = [];
      let totalValueUSD = 0;
      const totalValueNative = new Map<ChainId, number>();

      // Fetch data for each supported chain
      for (const chainId of Object.keys(CHAIN_CONFIG) as unknown as ChainId[]) {
        const holdings = MOCK_TOKEN_HOLDINGS[chainId] || [];
        const gasBalance = MOCK_GAS_BALANCES[chainId] || { balance: '0', balanceUSD: 0 };

        const chainTotalValueUSD = holdings.reduce((sum, holding) => sum + holding.valueUSD, 0);
        const chainTotalValueNative = holdings.reduce((sum, holding) => sum + holding.valueNative, 0);

        totalValueUSD += chainTotalValueUSD + gasBalance.balanceUSD;
        totalValueNative.set(chainId, chainTotalValueNative + parseFloat(gasBalance.balance));

        if (holdings.length > 0 || parseFloat(gasBalance.balance) > 0) {
          chains.push({
            chainId,
            chainName: CHAIN_CONFIG[chainId].name,
            chainSymbol: CHAIN_CONFIG[chainId].symbol,
            chainColor: CHAIN_CONFIG[chainId].color,
            totalValueUSD: chainTotalValueUSD + gasBalance.balanceUSD,
            totalValueNative: chainTotalValueNative + parseFloat(gasBalance.balance),
            gasBalance: gasBalance.balance,
            gasBalanceUSD: gasBalance.balanceUSD,
            holdings
          });
        }
      }

      return {
        totalValueUSD,
        totalValueNative,
        chains,
        lastUpdated: new Date().toISOString(),
        isLoading: false,
        error: null
      };

    } catch (error) {
      logger.error('Failed to fetch portfolio:', error);
      return {
        totalValueUSD: 0,
        totalValueNative: new Map(),
        chains: [],
        lastUpdated: new Date().toISOString(),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio'
      };
    }
  }

  /**
   * Calculate bridge suggestions based on portfolio distribution
   */
  static calculateBridgeSuggestions(portfolio: MultiChainPortfolio): BridgeSuggestion[] {
    const suggestions: BridgeSuggestion[] = [];

    // Find chains with small holdings that could be consolidated
    portfolio.chains.forEach(chain => {
      if (chain.totalValueUSD < 50000 && chain.holdings.length > 0) {
        // Suggest bridging to Ethereum (main chain)
        const targetChain = 1; // Ethereum
        
        chain.holdings.forEach(holding => {
          if (holding.chainId !== targetChain) {
            suggestions.push({
              fromChain: holding.chainId,
              toChain: targetChain,
              propertyId: holding.propertyId,
              propertyName: holding.propertyName,
              currentValue: holding.valueUSD,
              potentialSavings: holding.valueUSD * 0.02, // 2% potential savings
              reason: 'Consolidate small holdings to main chain for better liquidity'
            });
          }
        });
      }
    });

    // Suggest bridging for better APY
    portfolio.chains.forEach(chain => {
      chain.holdings.forEach(holding => {
        if (holding.apy && holding.apy < 7.0) {
          // Suggest bridging to Polygon for better APY
          suggestions.push({
            fromChain: holding.chainId,
            toChain: 137, // Polygon
            propertyId: holding.propertyId,
            propertyName: holding.propertyName,
            currentValue: holding.valueUSD,
            potentialSavings: holding.valueUSD * 0.015, // 1.5% better APY
            reason: 'Move to Polygon for better staking rewards'
          });
        }
      });
    });

    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Get gas prices for all chains
   */
  static async getGasPrices(): Promise<Record<ChainId, { gasPrice: string; gasPriceUSD: number }>> {
    // Mock gas prices
    return {
      1: { gasPrice: '35', gasPriceUSD: 115.5 },
      137: { gasPrice: '50', gasPriceUSD: 45 },
      56: { gasPrice: '8', gasPriceUSD: 4.8 }
    };
  }

  /**
   * Refresh portfolio data
   */
  static async refreshPortfolio(address: string): Promise<MultiChainPortfolio> {
    return this.fetchMultiChainPortfolio(address);
  }

  /**
   * Get portfolio performance over time
   */
  static async getPortfolioPerformance(address: string, days: number = 30): Promise<{
    date: string;
    value: number;
  }[]> {
    // Mock historical data
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseValue = 500000;
      const randomVariation = (Math.random() - 0.5) * 50000;
      const trend = (days - i) * 1000; // Upward trend
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: baseValue + randomVariation + trend
      });
    }
    
    return data;
  }
}
