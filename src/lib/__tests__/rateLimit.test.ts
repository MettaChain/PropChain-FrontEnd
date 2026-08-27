jest.mock('viem', () => ({ defineChain: (config: unknown) => config }));
jest.mock('@/config/env/schema', () => ({
  validateEnv: () => ({
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 2,
    RATE_LIMIT_MAX_REQUESTS_PER_WALLET: 2,
  }),
}));
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      body,
    })),
  },
}));

import {
  createRateLimitResponse,
  rateLimitByIP,
  stopRateLimitCleanup,
  withRateLimit,
} from '../rateLimit';

afterAll(() => stopRateLimitCleanup());

const request = (ip: string) => ({ headers: new Headers({ 'x-forwarded-for': ip }) }) as never;

describe('rate limiting', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '2';
  });

  it('allows requests until the configured limit and rejects the next one', async () => {
    const first = await rateLimitByIP(request('rate-limit-test'));
    const second = await rateLimitByIP(request('rate-limit-test'));
    const third = await rateLimitByIP(request('rate-limit-test'));

    expect(first).toMatchObject({ success: true, remaining: 1, limit: 2 });
    expect(second).toMatchObject({ success: true, remaining: 0, limit: 2 });
    expect(third).toMatchObject({ success: false, remaining: 0, limit: 2 });
    expect(third.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it('tracks different IPs independently', async () => {
    expect((await rateLimitByIP(request('one'))).success).toBe(true);
    expect((await rateLimitByIP(request('two'))).success).toBe(true);
  });

  it('passes through the handler and adds rate-limit headers', async () => {
    const handler = withRateLimit(async () => ({ headers: new Headers(), status: 200 }) as never);
    const response = await handler(request('pass-through'));

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('2');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('1');
  });

  it('returns a 429 response when the limit result is rejected', async () => {
    const response = createRateLimitResponse({
      success: false,
      limit: 2,
      remaining: 0,
      resetTime: Date.now() + 10000,
      retryAfter: 10,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('10');
  });
});
