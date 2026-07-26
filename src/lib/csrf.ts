import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-fallback-csrf-secret-key-32-chars-long!';
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
 */
export function generateTokenForSession(sessionId: string, authState: string): string {
  return crypto
    .createHmac('sha256', CSRF_SECRET)
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
  const expectedToken = generateTokenForSession(sessionId, authState);

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
export function withCsrf<T = any>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse<T> | NextResponse>
) {
  return async function (request: NextRequest, ...args: any[]): Promise<NextResponse> {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
    return handler(request, ...args);
  };
}
