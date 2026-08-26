import crypto from 'crypto';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { cookies } from 'next/headers';
import { getCsrfSessionId, getAuthStatePart, generateTokenForSession, validateCsrf, withCsrf } from '../../csrf';

function makeRequest(headers: Record<string, string> = {}, cookieValues: Record<string, string> = {}) {
  const cookieStore = new Map(Object.entries(cookieValues));
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    cookies: {
      get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
    },
  } as any;
}

describe('CSRF server-side lib', () => {
  describe('getCsrfSessionId', () => {
    it('returns existing cookie value', () => {
      const request = makeRequest({}, { 'csrf-session': 'existing-session-id' });
      const { sessionId, isNew } = getCsrfSessionId(request);
      expect(sessionId).toBe('existing-session-id');
      expect(isNew).toBe(false);
    });

    it('generates new UUID when no cookie', () => {
      const request = makeRequest();
      const { sessionId, isNew } = getCsrfSessionId(request);
      expect(isNew).toBe(true);
      expect(sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('generateTokenForSession', () => {
    it('returns a string token', () => {
      const token = generateTokenForSession('session-1', 'auth-1');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('produces consistent output for same inputs', () => {
      const t1 = generateTokenForSession('s', 'a');
      const t2 = generateTokenForSession('s', 'a');
      expect(t1).toBe(t2);
    });

    it('produces different output for different inputs', () => {
      const t1 = generateTokenForSession('s1', 'a');
      const t2 = generateTokenForSession('s2', 'a');
      expect(t1).not.toBe(t2);
    });
  });

  describe('validateCsrf', () => {
    it('returns true for matching token', () => {
      const sessionId = 'test-session';
      const authState = 'test-auth';
      const token = generateTokenForSession(sessionId, authState);

      const request = makeRequest(
        { 'x-csrf-token': token },
        { 'csrf-session': sessionId, 'auth-token': authState },
      );

      expect(validateCsrf(request)).toBe(true);
    });

    it('returns false for mismatched token', () => {
      const request = makeRequest(
        { 'x-csrf-token': 'wrong-token' },
        { 'csrf-session': 'test-session', 'auth-token': 'test-auth' },
      );

      expect(validateCsrf(request)).toBe(false);
    });

    it('returns false when no token provided', () => {
      const request = makeRequest({}, { 'csrf-session': 'test-session' });
      expect(validateCsrf(request)).toBe(false);
    });

    it('returns false when no session cookie', () => {
      const request = makeRequest({ 'x-csrf-token': 'some-token' }, {});
      expect(validateCsrf(request)).toBe(false);
    });
  });

  describe('withCsrf', () => {
    it('calls handler when CSRF is valid', async () => {
      const sessionId = 's1';
      const authState = 'a1';
      const token = generateTokenForSession(sessionId, authState);
      const request = makeRequest(
        { 'x-csrf-token': token },
        { 'csrf-session': sessionId, 'auth-token': authState },
      );

      const handler = jest.fn().mockResolvedValue({ status: 200 });
      const wrapped = withCsrf(handler);

      await wrapped(request);
      expect(handler).toHaveBeenCalledWith(request);
    });

    it('returns 403 when CSRF is invalid', async () => {
      const request = makeRequest({}, {});
      const handler = jest.fn();
      const wrapped = withCsrf(handler);

      const response = await wrapped(request);
      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });
});
