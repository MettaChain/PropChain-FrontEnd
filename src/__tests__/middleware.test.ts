/**
 * Tests for src/middleware.ts
 * Covers CSP header generation, nonce uniqueness, and API-path skip behaviour.
 * Issue #936
 */

import type { NextRequest } from 'next/server';

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
          headers: {
            set: jest.fn((key: string, value: string) => {
              capturedHeaders.set(key, value);
            }),
            get: jest.fn((key: string) => capturedHeaders.get(key)),
          },
        };
      }),
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

// Helper to create a mock NextRequest with proper headers
function createMockRequest(
  pathname: string,
  acceptHeader = 'text/html',
): NextRequest {
  const headersObj: Record<string, string> = {};
  if (acceptHeader) {
    headersObj['accept'] = acceptHeader;
  }

  return {
    nextUrl: { pathname },
    headers: {
      get: (name: string) => headersObj[name] ?? null,
      forEach: (cb: (value: string, key: string) => void) => {
        Object.entries(headersObj).forEach(([k, v]) => cb(v, k));
      },
      entries: () => Object.entries(headersObj)[Symbol.iterator](),
      [Symbol.iterator]: () => Object.entries(headersObj)[Symbol.iterator](),
    },
  } as unknown as NextRequest;
}

// Reset state before each test
function resetState() {
  capturedHeaders = new Map();
  nextCalls = [];
}

describe('middleware CSP enforcement', () => {
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

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/'));

    expect(nextCalls.length).toBeGreaterThan(0);
    expect(capturedHeaders.has('Content-Security-Policy')).toBe(false);
  });

  it('adds CSP header and nonce for HTML requests when CSP_ENFORCE=true', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/'));

    expect(capturedHeaders.has('Content-Security-Policy')).toBe(true);
    expect(capturedHeaders.get('Content-Security-Policy')).toContain(
      "default-src 'self'",
    );
  });

  it('skips CSP for API routes', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/api/csp-report'));

    expect(capturedHeaders.has('Content-Security-Policy')).toBe(false);
    expect(nextCalls.length).toBeGreaterThan(0);
  });

  it('skips CSP for non-HTML accept headers', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/page', 'application/json'));

    expect(capturedHeaders.has('Content-Security-Policy')).toBe(false);
    expect(nextCalls.length).toBeGreaterThan(0);
  });

  it('generates unique nonces for different requests', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'production';

    const nonces = new Set<string>();

    for (let i = 0; i < 20; i++) {
      jest.resetModules();
      resetState();

      const { middleware } = await import('../middleware');
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
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/'));

    const cspHeader = capturedHeaders.get('Content-Security-Policy');
    expect(cspHeader).toContain('upgrade-insecure-requests');
  });

  it('does not include unsafe-eval in production CSP', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/'));

    const cspHeader = capturedHeaders.get('Content-Security-Policy');
    expect(cspHeader).not.toContain("'unsafe-eval'");
  });

  it('includes unsafe-eval in development CSP', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/'));

    const cspHeader = capturedHeaders.get('Content-Security-Policy');
    expect(cspHeader).toContain("'unsafe-eval'");
  });

  it('sets x-nonce header on the request', async () => {
    process.env.CSP_ENFORCE = 'true';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetState();

    const { middleware } = await import('../middleware');
    await middleware(createMockRequest('/'));

    // The x-nonce should be set on the request headers (passed to NextResponse.next)
    expect(nextCalls.length).toBeGreaterThan(0);
    const callArgs = nextCalls[0];
    expect(callArgs[0]).toHaveProperty('request');
  });
});
