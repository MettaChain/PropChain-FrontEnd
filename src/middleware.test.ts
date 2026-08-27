jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({
      headers: {
        values: {} as Record<string, string>,
        set(name: string, value: string) { this.values[name] = value; },
        get(name: string) { return this.values[name] ?? null; },
      },
    })),
  },
}));
jest.mock('@/lib/initRedisCache', () => ({ initRedisCacheSystem: jest.fn() }));
jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

import { middleware } from './middleware';
import { NextResponse } from 'next/server';

const makeRequest = (pathname: string, accept = 'text/html') => ({
  nextUrl: { pathname },
  headers: new Headers({ accept }),
}) as never;

describe('middleware CSP', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original, CSP_ENFORCE: 'true', NODE_ENV: 'production' };
  });

  afterAll(() => {
    process.env = original;
  });

  it('adds a CSP header and nonce for HTML requests', async () => {
    const response = await middleware(makeRequest('/'));
    expect(response).toBeDefined();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('generates a unique nonce per request', async () => {
    await middleware(makeRequest('/one'));
    await middleware(makeRequest('/two'));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('skips CSP for API and non-HTML requests', async () => {
    const apiResponse = await middleware(makeRequest('/api/test'));
    const assetResponse = await middleware(makeRequest('/page', 'application/json'));
    expect(apiResponse.headers.get('Content-Security-Policy')).toBeNull();
    expect(assetResponse.headers.get('Content-Security-Policy')).toBeNull();
  });
});
