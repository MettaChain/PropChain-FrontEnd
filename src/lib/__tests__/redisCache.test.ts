import { redisCacheService } from '../redisCache';

const store = new Map<string, string>();
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
  del: jest.fn(() => Promise.resolve(1)),
  keys: jest.fn(() => Promise.resolve([])),
};

jest.mock('../redis', () => ({ getRedisClient: jest.fn(() => fakeClient) }));

describe('redisCacheService', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('records a cache miss then a hit for the same property', async () => {
    await redisCacheService.getProperty('p1');
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate:misses');

    await redisCacheService.setProperty({ id: 'p1' } as any);
    await redisCacheService.getProperty('p1');
    expect(fakeClient.incr).toHaveBeenCalledWith('cache:hit_rate');
  });

  it('falls back to null on JSON parse failure', async () => {
    store.set('property:bad', 'not-json{');
    const result = await redisCacheService.getProperty('bad');
    expect(result).toBeNull();
  });

  it('returns stats shape from getStats', async () => {
    const stats = await redisCacheService.getStats();
    expect(stats).toMatchObject({ hits: 0, misses: 0, total: 0, hitRate: 0 });
  });
});
