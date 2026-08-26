import { secondaryMarketService, MOCK_LISTINGS } from '../secondaryMarketService';

jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('secondaryMarketService', () => {
  describe('MOCK_LISTINGS', () => {
    it('contains at least 2 listings', () => {
      expect(MOCK_LISTINGS.length).toBeGreaterThanOrEqual(2);
    });

    it('each listing has required fields', () => {
      MOCK_LISTINGS.forEach((listing) => {
        expect(listing).toHaveProperty('id');
        expect(listing).toHaveProperty('propertyId');
        expect(listing).toHaveProperty('propertyName');
        expect(listing).toHaveProperty('sellerAddress');
        expect(listing).toHaveProperty('tokenCount');
        expect(listing).toHaveProperty('pricePerToken');
        expect(listing).toHaveProperty('currency');
        expect(listing).toHaveProperty('listedDate');
        expect(listing).toHaveProperty('blockchain');
        expect(listing).toHaveProperty('propertyImage');
      });
    });

    it('each listing has valid blockchain value', () => {
      const validBlockchains = ['ethereum', 'polygon', 'bsc'];
      MOCK_LISTINGS.forEach((listing) => {
        expect(validBlockchains).toContain(listing.blockchain);
      });
    });

    it('each listing has positive tokenCount', () => {
      MOCK_LISTINGS.forEach((listing) => {
        expect(listing.tokenCount).toBeGreaterThan(0);
      });
    });

    it('each listing has positive pricePerToken', () => {
      MOCK_LISTINGS.forEach((listing) => {
        expect(listing.pricePerToken).toBeGreaterThan(0);
      });
    });

    it('each listing has valid currency', () => {
      MOCK_LISTINGS.forEach((listing) => {
        expect(['USDT', 'USDC', 'ETH']).toContain(listing.currency);
      });
    });
  });

  describe('getListings', () => {
    it('returns all listings when no filters applied', async () => {
      const result = await secondaryMarketService.getListings();
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('filters by blockchain', async () => {
      const result = await secondaryMarketService.getListings({ blockchain: 'ethereum' });
      result.forEach((listing) => {
        expect(listing.blockchain).toBe('ethereum');
      });
    });

    it('filters by price range', async () => {
      const result = await secondaryMarketService.getListings({ minPrice: 100, maxPrice: 200 });
      result.forEach((listing) => {
        expect(listing.pricePerToken).toBeGreaterThanOrEqual(100);
        expect(listing.pricePerToken).toBeLessThanOrEqual(200);
      });
    });
  });
});
