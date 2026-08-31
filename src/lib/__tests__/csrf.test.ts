import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';
import {
  getAuthStatePart,
  getCsrfSessionId,
  generateTokenForSession,
  validateCsrf,
  withCsrf,
} from '@/lib/csrf';
import type { NextRequest } from 'next/server';

// The jsdom test environment does not provide the Fetch API globals that
// `NextRequest` needs, so mock the server response primitive instead.
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(
      (body: unknown, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        body,
        /** Resolve the mocked body like NextResponse.json().json(). */
        json: async () => body,
      })
    ),
  },
}));

const OLD_ENV = process.env;
const TEST_SECRET = 'test-csrf-secret-0123456789abcdef0123456789abcdef';
// The literal fallback that used to be hardcoded in src/lib/csrf.ts (issue #817).
const LEGACY_FALLBACK_SECRET = 'default-fallback-csrf-secret-key-32-chars-long!';

const csrfSourcePath = join(__dirname, '..', 'csrf.ts');

interface MockRequest {
  headers: { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
}

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV, CSRF_SECRET: TEST_SECRET };
});

afterAll(() => {
  process.env = OLD_ENV;
});

/** Build a minimal request-shaped object for the functions under test. */
const createRequest = (opts: {
  csrfToken?: string;
  sessionId?: string;
  authToken?: string;
} = {}): MockRequest => {
  const headers = new Map<string, string>();
  const cookies = new Map<string, string>();
  if (opts.csrfToken) headers.set('x-csrf-token', opts.csrfToken);
  if (opts.sessionId) cookies.set('csrf-session', opts.sessionId);
  if (opts.authToken) cookies.set('auth-token', opts.authToken);
  return {
    headers: {
      /** Return the header value or null, mirroring the Headers API. */
      get: (name) => headers.get(name) ?? null,
    },
    cookies: {
      /** Return the cookie or undefined, mirroring NextRequest cookies. */
      get: (name) => {
        const value = cookies.get(name);
        return value === undefined ? undefined : { value };
      },
    },
  };
};

/** Cast the mock request to the type expected by the CSRF helpers. */
const asNextRequest = (req: MockRequest) => req as unknown as NextRequest;

/**
 * Sign the same session/auth payload the module signs, with an arbitrary key.
 * Used to prove tokens minted with a different secret are rejected.
 */
const signWithSecret = (secret: string, sessionId: string, authState: string) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}:${authState}`)
    .digest('hex');

describe('session and authentication binding', () => {
  it('returns an existing CSRF session without replacing it', () => {
    const request = createRequest({ sessionId: 'existing-session' });

    expect(getCsrfSessionId(asNextRequest(request))).toEqual({
      sessionId: 'existing-session',
      isNew: false,
    });
  });

  it('creates a new session when the CSRF cookie is missing', () => {
    const randomUUID = jest.spyOn(crypto, 'randomUUID').mockReturnValue('generated-session');

    expect(getCsrfSessionId(asNextRequest(createRequest()))).toEqual({
      sessionId: 'generated-session',
      isNew: true,
    });

    randomUUID.mockRestore();
  });

  it('reads the auth cookie and defaults to an anonymous state', () => {
    expect(getAuthStatePart(asNextRequest(createRequest({ authToken: 'auth-1' })))).toBe('auth-1');
    expect(getAuthStatePart(asNextRequest(createRequest()))).toBe('');
  });
});

describe('generateTokenForSession', () => {
  it('fails closed (throws) when CSRF_SECRET is unset', () => {
    delete process.env.CSRF_SECRET;
    expect(() => generateTokenForSession('session-1', '')).toThrow(
      'Missing required environment variable: CSRF_SECRET'
    );
  });

  it('fails closed (throws) when CSRF_SECRET is an empty string', () => {
    process.env.CSRF_SECRET = '';
    expect(() => generateTokenForSession('session-1', '')).toThrow(
      'Missing required environment variable: CSRF_SECRET'
    );
  });

  it('mints an HMAC-SHA256 token when CSRF_SECRET is set', () => {
    const token = generateTokenForSession('session-1', 'auth-1');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).toBe(signWithSecret(TEST_SECRET, 'session-1', 'auth-1'));
  });

  it('produces different tokens for different sessions/auth states', () => {
    const tokenA = generateTokenForSession('session-1', 'auth-1');
    const tokenB = generateTokenForSession('session-2', 'auth-1');
    const tokenC = generateTokenForSession('session-1', 'auth-2');
    expect(tokenA).not.toBe(tokenB);
    expect(tokenA).not.toBe(tokenC);
  });
});

describe('validateCsrf', () => {
  it('accepts a valid token minted with the configured secret', () => {
    const sessionId = 'session-1';
    const token = generateTokenForSession(sessionId, '');
    expect(validateCsrf(asNextRequest(createRequest({ csrfToken: token, sessionId })))).toBe(true);
  });

  it('rejects a token signed with the old hardcoded fallback secret', () => {
    const sessionId = 'session-1';
    const forgedToken = signWithSecret(LEGACY_FALLBACK_SECRET, sessionId, '');
    const req = createRequest({ csrfToken: forgedToken, sessionId });
    expect(validateCsrf(asNextRequest(req))).toBe(false);
  });

  it('fails closed when CSRF_SECRET is unset, even with a previously valid token', () => {
    const sessionId = 'session-1';
    const token = generateTokenForSession(sessionId, '');
    delete process.env.CSRF_SECRET;
    const req = createRequest({ csrfToken: token, sessionId });
    expect(validateCsrf(asNextRequest(req))).toBe(false);
  });

  it('rejects a request with no CSRF token header', () => {
    const req = createRequest({ sessionId: 'session-1' });
    expect(validateCsrf(asNextRequest(req))).toBe(false);
  });

  it('rejects a request with no session cookie', () => {
    const token = generateTokenForSession('session-1', '');
    const req = createRequest({ csrfToken: token });
    expect(validateCsrf(asNextRequest(req))).toBe(false);
  });

  it('rejects a tampered token', () => {
    const sessionId = 'session-1';
    const token = generateTokenForSession(sessionId, '');
    const req = createRequest({ csrfToken: `${token}ff`, sessionId });
    expect(validateCsrf(asNextRequest(req))).toBe(false);
  });
});

describe('withCsrf', () => {
  /** Handler that resolves successfully when CSRF validation passes. */
  const okHandler = async () => NextResponse.json({ ok: true });

  it('returns 403 when CSRF validation fails', async () => {
    const wrapped = withCsrf(okHandler);
    const res = await wrapped(asNextRequest(createRequest({ sessionId: 'session-1' })));
    expect(res.status).toBe(403);
  });

  it('invokes the handler when CSRF validation passes', async () => {
    const wrapped = withCsrf(okHandler);
    const sessionId = 'session-1';
    const token = generateTokenForSession(sessionId, '');
    const res = await wrapped(
      asNextRequest(createRequest({ csrfToken: token, sessionId }))
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns 403 when CSRF_SECRET is unset', async () => {
    delete process.env.CSRF_SECRET;
    const sessionId = 'session-1';
    const token = signWithSecret(TEST_SECRET, sessionId, '');
    const wrapped = withCsrf(okHandler);
    const res = await wrapped(
      asNextRequest(createRequest({ csrfToken: token, sessionId }))
    );
    expect(res.status).toBe(403);
  });
});

describe('src/lib/csrf.ts (regression guard)', () => {
  it('no longer contains the hardcoded fallback secret', () => {
    const source = readFileSync(csrfSourcePath, 'utf-8');
    expect(source).not.toContain(LEGACY_FALLBACK_SECRET);
  });
});
