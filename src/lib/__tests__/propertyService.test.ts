jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// propertyService normally talks to Redis, IndexedDB, and network-status
// checks before it ever reaches the mock data. These mocks force every
// call to skip the cache layer and go straight to the in-memory
// MOCK_PROPERTIES array, so the tests below are exercising the actual
// filter/sort/lookup logic in propertyService.ts, not the caching layer.
jest.mock('@/lib/redisCache', () => ({
  redisCacheService: {
    getPropertyListings: jest.fn().mockResolvedValue(null),
    setPropertyListings: jest.fn().mockResolvedValue(undefined),
    getProperty: jest.fn().mockResolvedValue(null),
    setProperty: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/lib/propertyCache', () => ({
  getCachedProperty: jest.fn().mockResolvedValue({ data: null, stale: false }),
  setCachedProperty: jest.fn().mockResolvedValue(undefined),
  getCachedSearchResult: jest.fn().mockResolvedValue(null),
  cacheSearchResult: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/cacheManager', () => ({
  isNetworkOnline: jest.fn(() => true),
}));

import { propertyService } from '@/lib/propertyService';
import { DEFAULT_FILTERS } from '@/types/property';
import type { SearchFilters } from '@/types/property';

// Helper to start from a clean copy of the default filters for each test,
// so one test's mutations can never leak into another.
const baseFilters = (): SearchFilters => ({
  ...DEFAULT_FILTERS,
  priceRange: [...DEFAULT_FILTERS.priceRange] as [number, number],
  squareFeetRange: [...DEFAULT_FILTERS.squareFeetRange] as [number, number],
  propertyTypes: [...DEFAULT_FILTERS.propertyTypes],
  blockchains: [...DEFAULT_FILTERS.blockchains],
  bedrooms: [...DEFAULT_FILTERS.bedrooms],
  bathrooms: [...DEFAULT_FILTERS.bathrooms],
  status: [...DEFAULT_FILTERS.status],
});

describe('propertyService', () => {
  describe('searchProperties - filtering', () => {
    it('returns only the mock properties inside the default price/size caps', async () => {
      // DEFAULT_FILTERS caps priceRange at 10,000,000 and squareFeetRange at
      // 50,000, so it does NOT return all 8 mock properties - it narrows
      // them down to the 4 that fall inside both ranges (ids 1, 3, 6, 8).
      const result = await propertyService.searchProperties(baseFilters());
      expect(result.properties.map((p) => p.id).sort()).toEqual(['1', '3', '6', '8']);
      expect(result.total).toBe(4);
    });

    it('filters by a single property type', async () => {
      const filters = { ...baseFilters(), propertyTypes: ['residential' as const] };
      const result = await propertyService.searchProperties(filters);

      expect(result.total).toBe(4);
      result.properties.forEach((property) => {
        expect(property.propertyType).toBe('residential');
      });
    });

    it('filters by price range (inclusive of both bounds)', async () => {
      const filters = { ...baseFilters(), priceRange: [0, 5000000] as [number, number] };
      const result = await propertyService.searchProperties(filters);

      expect(result.properties.map((p) => p.id).sort()).toEqual(['1', '3', '6']);
      result.properties.forEach((property) => {
        expect(property.price.total).toBeLessThanOrEqual(5000000);
      });
    });

    it('filters by location (case-insensitive city match)', async () => {
      const filters = { ...baseFilters(), location: 'brooklyn' };
      const result = await propertyService.searchProperties(filters);

      expect(result.total).toBe(1);
      expect(result.properties[0].location.city).toBe('Brooklyn');
    });

    it('applies multiple filters together (propertyType + blockchain)', async () => {
      const filters = {
        ...baseFilters(),
        propertyTypes: ['residential' as const],
        blockchains: ['ethereum' as const],
      };
      const result = await propertyService.searchProperties(filters);

      expect(result.properties.map((p) => p.id).sort()).toEqual(['1', '6']);
      result.properties.forEach((property) => {
        expect(property.propertyType).toBe('residential');
        expect(property.blockchain).toBe('ethereum');
      });
    });

    it('returns an empty result set when no property matches the filters', async () => {
      const filters = { ...baseFilters(), location: 'nonexistent-city-xyz' };
      const result = await propertyService.searchProperties(filters);

      expect(result.total).toBe(0);
      expect(result.properties).toEqual([]);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getPropertyById', () => {
    it('returns the matching property for a valid id', async () => {
      const property = await propertyService.getPropertyById('3');

      expect(property).not.toBeNull();
      expect(property?.id).toBe('3');
      expect(property?.location.city).toBe('Seminyak');
    });

    it('returns null for an id that does not exist', async () => {
      const property = await propertyService.getPropertyById('does-not-exist');
      expect(property).toBeNull();
    });
  });
});
