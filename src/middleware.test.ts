/**
 * Tests for src/middleware.ts
 * Covers CSP header generation, nonce uniqueness, Redis init, and
 * auth-gated protected-route token handling.
 */

import { TextEncoder } from 'util';
import type { NextRequest } from 'next/server';
import {
  signTestToken,
  verifyTestToken,
} from './__tests__/helpers/middlewareJwtTestHelper';

// Track all headers set on responses across module resets
let capturedHeaders: Map<string, string>;
// Track calls to NextResponse.next across module resets
let nextCalls: unknown[][];

jest.mock('next/server', () => {
  capturedHeaders = new Map();
  nextCalls = [];

  return {
    NextResponse: {
      next: jest.fn((...args: unknown[]) => {
        nextCalls.push(args);
        return {
          type: 'next',
          headers: {
            set: jest.fn((key: string, value: string) => {
              capturedHeaders.set(key, value);
            }),
            get: jest.fn((key: string) => capturedHeaders.get(key) ?? null),
          },
        };
      }),
      redirect: jest.fn((url: URL) => ({
        type: 'redirect',
        url,
        cookies: {
          delete: jest.fn(),
        },
      })),
    },
  };
});

jest.mock('@/lib/initRedisCache', () => ({
  initRedisCacheSystem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('jose', () => ({
  jwtVerify: jest.fn((token: string, secret: Uint8Array) =>
    verifyTestToken(token, secret),
  ),
}));

function createMockRequest(
  pathname: string,
  acceptHeader = 'text/html',
): NextRequest {
  const headersObj: Record<string, string> = {};
  if (acceptHeader) {
    headersObj['accept'] = acceptHeader;
  }
  const cookieStore = new Map<string, string>();

  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    headers: {
      get: (name: string) => headersObj[name] ?? null,
      forEach: (cb: (value: string, key: string) => void) => {
        Object.entries(headersObj).forEach(([k, v]) => cb(v, k));
      },
      entries: () => Object.entries(headersObj)[Symbol.iterator](),
      [Symbol.iterator]: () => Object.entries(headersObj)[Symbol.iterator](),
    },
    cookies: {
      get: (name: string) => {
        const value = cookieStore.get(name);
        return value === undefined ? undefined : { value };
      },
      set: (name: string, value: string) => {
        cookieStore.set(name, value);
      },
    },
  } as unknown as NextRequest;
}

function resetState() {
  capturedHeaders = new Map();
  nextCalls = [];
}

describe('middleware CSP enforcement, Redis init', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetState();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns NextResponse.next() when CSP_ENFORCE is not true', async () => {
    process.env.CSP_ENFORCE = 'false';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/'));

    expect(nextCalls.length).toBeGreaterThan(0);
    expect(capturedHeaders.has('Content-Security-Policy')).toBe(false);
  });

  it('adds CSP header and nonce for HTML requests when CSP_ENFORCE=true', async () => {
    process.env.CSP_ENFORCE = 'true';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/'));

    expect(capturedHeaders.has('Content-Security-Policy')).toBe(true);
    expect(capturedHeaders.get('Content-Security-Policy')).toContain(
      "default-src 'self'",
    );
  });

  it('skips CSP for API routes', async () => {
    process.env.CSP_ENFORCE = 'true';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/api/csp-report'));

    expect(capturedHeaders.has('Content-Security-Policy')).toBe(false);
    expect(nextCalls.length).toBeGreaterThan(0);
  });

  it('skips CSP for non-HTML accept headers', async () => {
    process.env.CSP_ENFORCE = 'true';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/page', 'application/json'));

    expect(capturedHeaders.has('Content-Security-Policy')).toBe(false);
    expect(nextCalls.length).toBeGreaterThan(0);
  });

  it('generates unique nonces for different requests', async () => {
    process.env.CSP_ENFORCE = 'true';

    const nonces = new Set<string>();

    for (let i = 0; i < 20; i++) {
      jest.resetModules();
      resetState();

      const { middleware } = await import('./middleware');
      await middleware(createMockRequest('/'));

      const cspHeader = capturedHeaders.get('Content-Security-Policy');
      if (cspHeader) {
        const nonceMatch = cspHeader.match(/nonce-([A-Za-z0-9+/=]+)/);
        if (nonceMatch) nonces.add(nonceMatch[1]);
      }
    }

    expect(nonces.size).toBeGreaterThan(1);
  });

  it('includes upgrade-insecure-requests in production', async () => {
    process.env.CSP_ENFORCE = 'true';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/'));

    const cspHeader = capturedHeaders.get('Content-Security-Policy');
    expect(cspHeader).toContain('upgrade-insecure-requests');
  });

  it('does not include unsafe-eval in production CSP', async () => {
    process.env.CSP_ENFORCE = 'true';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/'));

    const cspHeader = capturedHeaders.get('Content-Security-Policy');
    expect(cspHeader).not.toContain("'unsafe-eval'");
  });

  it('includes unsafe-eval in development CSP', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    resetState();

    const { middleware } = await import('./middleware');
    await middleware(createMockRequest('/'));

    const cspHeader = capturedHeaders.get('Content-Security-Policy');
    expect(cspHeader).toContain("'unsafe-eval'");
  });

  it('sets a unique, non-empty x-nonce header on the request each invocation', async () => {
    process.env.CSP_ENFORCE = 'true';
    const seen = new Set<string>();

    for (let i = 0; i < 2; i++) {
      jest.resetModules();
      resetState();

      const { middleware } = await import('./middleware');
      await middleware(createMockRequest('/'));

      expect(nextCalls.length).toBeGreaterThan(0);
      const callArgs = nextCalls[0] as [{ request: { headers: Headers } }];
      const nonce = callArgs[0].request.headers.get('x-nonce');
      expect(nonce).toBeTruthy();
      seen.add(nonce as string);
    }

    expect(seen.size).toBe(2);
  });
});

describe('middleware auth-gated protected routes', () => {
  const secretKey = 'test-secret-with-at-least-32-characters';
  const wrongSecret = 'a-different-secret-that-does-not-match-32chars';
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { TextEncoder: typeof TextEncoder }
    ).TextEncoder = TextEncoder;
  });

  beforeEach(() => {
    jest.resetModules();
    resetState();
    originalEnv = process.env;
    process.env = { ...originalEnv, AUTH_SECRET: secretKey, CSP_ENFORCE: 'false' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createAuthRequest = (pathname: string, tokenValue?: string) => {
    const req = createMockRequest(pathname) as unknown as {
      cookies: { set: (name: string, value: string) => void };
    };
    if (tokenValue !== undefined) {
      req.cookies.set('auth-token', tokenValue);
    }
    return req as unknown as NextRequest;
  };

  it('allows public routes without a token', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(createAuthRequest('/public'));
    expect((res as unknown as { type: string }).type).toBe('next');
  });

  it('redirects protected routes without a token', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(createAuthRequest('/dashboard'));
    expect((res as unknown as { type: string; url: URL }).type).toBe(
      'redirect',
    );
    expect(
      (res as unknown as { type: string; url: URL }).url.pathname,
    ).toBe('/');
  });

  it('allows protected routes with a valid token', async () => {
    const { middleware } = await import('./middleware');
    const token = signTestToken(secretKey, 3600);
    const res = await middleware(createAuthRequest('/dashboard', token));
    expect((res as unknown as { type: string }).type).toBe('next');
  });

  it('redirects protected routes with an expired token', async () => {
    const { middleware } = await import('./middleware');
    const token = signTestToken(secretKey, -3600);
    const res = await middleware(createAuthRequest('/dashboard', token));
    expect((res as unknown as { type: string }).type).toBe('redirect');
  });

  it('redirects protected routes with a tampered token', async () => {
    const { middleware } = await import('./middleware');
    const token = signTestToken(secretKey, 3600);
    const res = await middleware(
      createAuthRequest('/dashboard', `${token}tampered`),
    );
    expect((res as unknown as { type: string }).type).toBe('redirect');
  });

  it('rejects a token signed with a different secret', async () => {
    const { middleware } = await import('./middleware');
    const token = signTestToken(wrongSecret, 3600);
    const res = await middleware(createAuthRequest('/dashboard', token));
    expect((res as unknown as { type: string }).type).toBe('redirect');
  });

  it('fails closed when AUTH_SECRET is missing', async () => {
    delete process.env.AUTH_SECRET;
    const { middleware } = await import('./middleware');
    const token = signTestToken(secretKey, 3600);
    const res = await middleware(createAuthRequest('/dashboard', token));
    expect((res as unknown as { type: string }).type).toBe('redirect');
  });

  it('fails closed when AUTH_SECRET is empty', async () => {
    process.env.AUTH_SECRET = '   ';
    const { middleware } = await import('./middleware');
    const token = signTestToken(secretKey, 3600);
    const res = await middleware(createAuthRequest('/dashboard', token));
    expect((res as unknown as { type: string }).type).toBe('redirect');
  });
});
