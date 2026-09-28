import { redisCacheService, CACHE_KEYS } from '../redisCache';
import { MOCK_PROPERTIES } from '../mockData';
import type { SearchFilters } from '@/types/property';

const store = new Map<string, string>();
const sets = new Map<string, Set<string>>();

const fakeClient = {
  get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setex: jest.fn((key: string, _ttl: number, value: string) => {
    store.set(key, value);
    return Promise.resolve('OK');
  }),
  incr: jest.fn((key: string) => {
    const next = String(Number(store.get(key) ?? '0') + 1);
    store.set(key, next);
    return Promise.resolve(Number(next));
  }),
  del: jest.fn((...keys: string[]) => {
    keys.forEach((key) => {
      store.delete(key);
      sets.delete(key);
    });
    return Promise.resolve(keys.length);
  }),
  // The fake client has no key prefix, so normalize the physical pattern
  // (`propchain:*`) that invalidatePattern builds back to logical names.
  keys: jest.fn((pattern: string) => {
    const prefix = pattern.replace(/^propchain:/, '').replace('*', '');
    return Promise.resolve([...store.keys()].filter((key) => key.startsWith(prefix)));
  }),
  sadd: jest.fn((key: string, ...members: string[]) => {
    if (!sets.has(key)) sets.set(key, new Set());
    members.forEach((member) => sets.get(key)!.add(member));
    return Promise.resolve(members.length);
  }),
  srem: jest.fn((key: string, ...members: string[]) => {
    members.forEach((member) => sets.get(key)?.delete(member));
    return Promise.resolve(members.length);
  }),
  smembers: jest.fn((key: string) => Promise.resolve([...(sets.get(key) ?? [])])),
  expire: jest.fn(() => Promise.resolve(1)),
  ping: jest.fn(() => Promise.resolve('PONG')),
};

jest.mock('../redis', () => ({
  getRedisClient: jest.fn(() => fakeClient),
  REDIS_KEY_PREFIX: 'propchain:',
}));

const FILTERS: SearchFilters = {
  query: '',
  priceRange: [0, 10000000],
  propertyTypes: [],
  blockchains: [],
  roiMin: 0,
  roiMax: 100,
  location: '',
  bedrooms: [],
  bathrooms: [],
  squareFeetRange: [0, 50000],
  status: ['active'],
};

const otherFilters: SearchFilters = { ...FILTERS, location: 'Miami' };

describe('redisCacheService', () => {
  beforeEach(() => {
    store.clear();
    sets.clear();
    jest.clearAllMocks();
  });

  it('records a cache miss then a hit for the same property', async () => {
    const property = MOCK_PROPERTIES[0];

    await redisCacheService.getProperty('missing');
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate:misses');

    await redisCacheService.setProperty(property);
    const cached = await redisCacheService.getProperty(property.id);

    expect(cached).toEqual(property);
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate');
  });

  it('falls back to null on JSON parse failure', async () => {
    store.set('property:bad', 'not-json{');
    const result = await redisCacheService.getProperty('bad');
    expect(result).toBeNull();
  });

  it('discards a poisoned payload that parses but fails schema validation', async () => {
    store.set('property:poisoned', JSON.stringify({ id: 'poisoned', evil: '<script>' }));

    const result = await redisCacheService.getProperty('poisoned');

    expect(result).toBeNull();
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate:invalid');
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate:misses');
  });

  it('discards a search result payload with a malformed property entry', async () => {
    const key = CACHE_KEYS.PROPERTY_LISTING(FILTERS, 'newest', 1);
    store.set(
      key,
      JSON.stringify({ properties: [{ id: 'x' }], total: 1, page: 1, totalPages: 1 })
    );

    const result = await redisCacheService.getPropertyListings(FILTERS, 'newest', 1);

    expect(result).toBeNull();
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate:invalid');
  });

  it('returns stats shape from getStats', async () => {
    const stats = await redisCacheService.getStats();
    expect(stats).toMatchObject({ hits: 0, misses: 0, total: 0, hitRate: 0, invalid: 0 });
  });

  it('invalidates only the keys related to an updated property', async () => {
    const [first, second] = MOCK_PROPERTIES;
    const relatedListingKey = CACHE_KEYS.PROPERTY_LISTING(FILTERS, 'newest', 1);
    const unrelatedListingKey = CACHE_KEYS.PROPERTY_LISTING(otherFilters, 'newest', 1);

    await redisCacheService.setProperty(first);
    await redisCacheService.setProperty(second);
    await redisCacheService.setPropertyListings(FILTERS, 'newest', 1, {
      properties: [first],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    await redisCacheService.setPropertyListings(otherFilters, 'newest', 1, {
      properties: [second],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    await redisCacheService.invalidateProperty(first.id);

    // Related entries are gone...
    expect(store.has(relatedListingKey)).toBe(false);
    // ...while unrelated cache entries survive the update.
    expect(store.has(unrelatedListingKey)).toBe(true);
    expect(await redisCacheService.getProperty(second.id)).toEqual(second);
  });
});
