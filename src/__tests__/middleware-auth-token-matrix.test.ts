import type { NextRequest } from 'next/server';
import { signTestToken, verifyTestToken } from './helpers/middlewareJwtTestHelper';

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url: URL) => ({ type: 'redirect', url, cookies: { delete: jest.fn() } })),
  },
}));
jest.mock('@/lib/initRedisCache', () => ({ initRedisCacheSystem: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } }));
jest.mock('jose', () => ({ jwtVerify: (t: string, s: Uint8Array) => verifyTestToken(t, s) }));

const secret = 'test-secret-with-at-least-32-characters';

function mkReq(pathname: string, token?: string): NextRequest {
  const cookies = new Map<string, string>();
  if (token) cookies.set('auth-token', token);
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    headers: { get: () => null },
    cookies: { get: (n: string) => (cookies.has(n) ? { value: cookies.get(n) } : undefined) },
  } as unknown as NextRequest;
}

describe('root auth middleware token validation matrix', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.AUTH_SECRET = secret;
    process.env.CSP_ENFORCE = 'false';
  });

  it.each([
    ['no cookie', undefined, 'redirect'],
    ['expired token', signTestToken(secret, -60), 'redirect'],
    ['valid token', signTestToken(secret, 60), 'next'],
    ['malformed signature', 'not.a.jwt', 'redirect'],
  ])('%s -> %s', async (_label, token, expected) => {
    const { middleware } = await import('../middleware');
    const res = await middleware(mkReq('/dashboard', token as string | undefined));
    expect((res as { type: string }).type).toBe(expected);
  });

  it('allows a public route regardless of token', async () => {
    const { middleware } = await import('../middleware');
    const res = await middleware(mkReq('/public'));
    expect((res as { type: string }).type).toBe('next');
  });
});
