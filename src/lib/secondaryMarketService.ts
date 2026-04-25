import type { SecondaryMarketListing, OrderBookEntry, BlockchainNetwork } from '@/types/property';

/**
 * Secondary Market Service
 * Handles API calls for P2P token trading
 */

// Mock data for initial implementation
const MOCK_LISTINGS: SecondaryMarketListing[] = [
  {
    id: 'sec-1',
    propertyId: 'prop-1',
    propertyName: 'Downtown Luxury Apartment',
    sellerAddress: '0x1234...5678',
    tokenCount: 50,
    pricePerToken: 110.5,
    currency: 'USDT',
    listedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    blockchain: 'ethereum',
    propertyImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'sec-2',
    propertyId: 'prop-2',
    propertyName: 'Beachfront Villa',
    sellerAddress: '0x8765...4321',
    tokenCount: 25,
    pricePerToken: 250.0,
    currency: 'USDC',
    listedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    blockchain: 'polygon',
    propertyImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800'
  }
];

export const secondaryMarketService = {
  /**
   * Get all secondary market listings
   */
  getListings: async (filters?: { propertyId?: string, blockchain?: BlockchainNetwork }): Promise<SecondaryMarketListing[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let filtered = [...MOCK_LISTINGS];
    if (filters?.propertyId) {
      filtered = filtered.filter(l => l.propertyId === filters.propertyId);
    }
    if (filters?.blockchain) {
      filtered = filtered.filter(l => l.blockchain === filters.blockchain);
    }
    
    return filtered;
  },

  /**
   * Get order book for a specific property token
   */
  getOrderBook: async (propertyId: string): Promise<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      asks: [
        { price: 112.5, amount: 10, total: 1125, type: 'sell' },
        { price: 111.0, amount: 15, total: 1665, type: 'sell' },
        { price: 110.5, amount: 25, total: 2762.5, type: 'sell' },
      ],
      bids: [
        { price: 109.5, amount: 20, total: 2190, type: 'buy' },
        { price: 108.0, amount: 30, total: 3240, type: 'buy' },
        { price: 107.5, amount: 50, total: 5375, type: 'buy' },
      ]
    };
  },

  /**
   * List tokens for sale
   */
  listTokens: async (data: Omit<SecondaryMarketListing, 'id' | 'listedDate'>): Promise<SecondaryMarketListing> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newListing: SecondaryMarketListing = {
      ...data,
      id: `sec-${Math.random().toString(36).substr(2, 9)}`,
      listedDate: new Date().toISOString(),
    };
    
    return newListing;
  },

  /**
   * Buy tokens from a listing
   */
  buyTokens: async (listingId: string, amount: number): Promise<{ transactionHash: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };
  }
};
