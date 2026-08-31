import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireEnvStrict } from '@/lib/requireEnv';

const CSRF_SESSION_COOKIE = 'csrf-session';

/**
 * Gets or generates a unique session ID for CSRF binding.
 */
export function getCsrfSessionId(request: NextRequest): { sessionId: string; isNew: boolean } {
  let sessionId = request.cookies.get(CSRF_SESSION_COOKIE)?.value;
  let isNew = false;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    isNew = true;
  }
  return { sessionId, isNew };
}

/**
 * Extracts the user's auth token to bind CSRF token to authentication state.
 */
export function getAuthStatePart(request: NextRequest): string {
  return request.cookies.get('auth-token')?.value || '';
}

/**
 * Generates an HMAC-SHA256 token bound to a session and authentication state.
 *
 * Fails closed: throws when `CSRF_SECRET` is not configured, so no token is
 * ever minted with a guessable or hardcoded key.
 */
export function generateTokenForSession(sessionId: string, authState: string): string {
  const secret = requireEnvStrict('CSRF_SECRET');
  return crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}:${authState}`)
    .digest('hex');
}

/**
 * Validates the CSRF token in constant time.
 */
export function validateCsrf(request: NextRequest): boolean {
  const tokenFromHeader = request.headers.get('x-csrf-token');
  if (!tokenFromHeader) {
    return false;
  }

  const sessionId = request.cookies.get(CSRF_SESSION_COOKIE)?.value;
  if (!sessionId) {
    return false;
  }

  const authState = getAuthStatePart(request);

  let expectedToken: string;
  try {
    expectedToken = generateTokenForSession(sessionId, authState);
  } catch {
    // Fail closed: without a configured secret no token can ever be valid.
    return false;
  }

  try {
    const tokenBuffer = Buffer.from(tokenFromHeader);
    const expectedBuffer = Buffer.from(expectedToken);
    
    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * A middleware wrapper to enforce CSRF token validation on write handlers.
 */
export function withCsrf<T = unknown>(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse<T> | NextResponse>
) {
  return async function (request: NextRequest, ...args: unknown[]): Promise<NextResponse> {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
    return handler(request, ...args);
  };
}
