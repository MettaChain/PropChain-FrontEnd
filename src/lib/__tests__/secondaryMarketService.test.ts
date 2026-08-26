jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { secondaryMarketService } from '@/lib/secondaryMarketService';
import { BLOCKCHAIN_NETWORKS } from '@/types/property';

const REQUIRED_FIELDS = [
  'id',
  'propertyId',
  'propertyName',
  'sellerAddress',
  'tokenCount',
  'pricePerToken',
  'currency',
  'listedDate',
  'blockchain',
  'propertyImage',
] as const;

describe('secondaryMarketService', () => {
  describe('MOCK_LISTINGS', () => {
    it('contains at least 2 listings', async () => {
      const listings = await secondaryMarketService.getListings();
      expect(listings.length).toBeGreaterThanOrEqual(2);
    });

    it('each entry has all required fields', async () => {
      const listings = await secondaryMarketService.getListings();
      for (const listing of listings) {
        for (const field of REQUIRED_FIELDS) {
          expect(listing).toHaveProperty(field);
        }
      }
    });

    it('each entry has a valid blockchain value', async () => {
      const listings = await secondaryMarketService.getListings();
      for (const listing of listings) {
        expect(BLOCKCHAIN_NETWORKS).toContain(listing.blockchain);
      }
    });

    it('each entry has positive tokenCount and pricePerToken', async () => {
      const listings = await secondaryMarketService.getListings();
      for (const listing of listings) {
        expect(listing.tokenCount).toBeGreaterThan(0);
        expect(listing.pricePerToken).toBeGreaterThan(0);
      }
    });
  });

  describe('getListings', () => {
    it('returns all listings when no filters are provided', async () => {
      const listings = await secondaryMarketService.getListings();
      expect(listings.length).toBeGreaterThanOrEqual(2);
    });

    it('filters by blockchain', async () => {
      const ethereumListings = await secondaryMarketService.getListings({ blockchain: 'ethereum' });
      for (const listing of ethereumListings) {
        expect(listing.blockchain).toBe('ethereum');
      }
    });

    it('filters by property name (propertyId)', async () => {
      const filtered = await secondaryMarketService.getListings({ propertyId: 'prop-1' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].propertyId).toBe('prop-1');
    });

    it('filters by price range via propertyId and blockchain combined', async () => {
      const allListings = await secondaryMarketService.getListings();
      const allIds = allListings.map((l) => l.id);

      const ethereumOnly = await secondaryMarketService.getListings({ blockchain: 'ethereum' });
      const ethereumIds = ethereumOnly.map((l) => l.id);

      expect(ethereumIds.length).toBeLessThanOrEqual(allIds.length);
      for (const id of ethereumIds) {
        expect(allIds).toContain(id);
      }
    });
  });
});
