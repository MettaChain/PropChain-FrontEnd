/**
 * Smoke coverage for /api/properties and /api/cache/stats (#1053).
 */
jest.mock('@/lib/csrf', () => ({ withCsrf: <T,>(h: T): T => h }));
jest.mock('@/lib/rateLimit', () => ({ withRateLimit: <T,>(h: T): T => h }));
jest.mock('@/lib/redisCache', () => ({ redisCacheService: { search: jest.fn() } }));
jest.mock('@/lib/redis', () => ({
  getRedisInfo: jest.fn(),
  testRedisConnection: jest.fn(),
}));

import { NextRequest } from 'next/server';

function req(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new Request(url, { headers }));
}

describe('GET /api/properties', () => {
  it('rejects an invalid page parameter', async () => {
    const { GET } = await import('./properties/route');
    const res = await GET(req('http://localhost/api/properties?page=-1'));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/cache/stats', () => {
  const OLD_KEY = process.env.CACHE_STATS_ADMIN_KEY;
  beforeAll(() => {
    process.env.CACHE_STATS_ADMIN_KEY = 'test-admin-key';
  });
  afterAll(() => {
    process.env.CACHE_STATS_ADMIN_KEY = OLD_KEY;
  });

  it('returns 401 without the admin key header', async () => {
    const { GET } = await import('./cache/stats/route');
    const res = await GET(req('http://localhost/api/cache/stats'));
    expect(res.status).toBe(401);
  });
});
