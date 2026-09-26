/**
 * Next.js Middleware: auth-gated protected routes, Redis cache
 * initialization, and nonce-based CSP enforcement.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { initRedisCacheSystem } from '@/lib/initRedisCache';
import { logger } from '@/utils/logger';

const isDev = process.env.NODE_ENV === 'development';
const isCspEnforced = process.env.CSP_ENFORCE === 'true';

// Admin routes require an authenticated session. This project has no
// roles/permissions system yet, so this closes the "fully public admin
// surface" hole by requiring auth; enforcing a specific admin role is a
// follow-up once such a system exists.
const ADMIN_ROUTES = ['/admin'];
// Paths that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/portfolio', '/settings', '/invest'];

const createNonce = () => {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const buildCspHeader = (nonce: string) => {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    isDev
      ? "connect-src 'self' https: wss: ws: http:"
      : "connect-src 'self' https: wss:",
    "media-src 'self' data: blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // report-uri is deprecated but kept alongside report-to for browsers
    // (e.g. older Safari) that don't yet support the Reporting API.
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ];

  if (!isDev) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
};

const REPORTING_ENDPOINTS_HEADER = 'csp-endpoint="/api/csp-report"';

const shouldApplyCsp = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api') || pathname === '/sw.js') {
    return false;
  }

  const acceptHeader = request.headers.get('accept') || '';
  return acceptHeader.includes('text/html');
};

/**
 * Redirects unauthenticated requests to admin routes back to "/". Returns
 * null when the request may continue.
 */
async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isAdminRoute) {
    return null;
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secretKey = process.env.AUTH_SECRET?.trim();
    if (!secretKey) {
      throw new Error('AUTH_SECRET is not configured');
    }

    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(token, secret, { clockTolerance: 15 });

    return null;
  } catch {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth-token');
    return response;
  }
}

/**
 * Redirects to "/" with a callbackUrl if the request is for a protected
 * route and doesn't carry a valid auth token. Returns null when the
 * request may continue.
 */
async function checkAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtectedRoute) {
    return null;
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secretKey = process.env.AUTH_SECRET?.trim();
    if (!secretKey) {
      throw new Error('AUTH_SECRET is not configured');
    }

    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(token, secret, { clockTolerance: 15 });

    return null;
  } catch {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth-token');
    return response;
  }
}

// Flag to track if Redis has been initialized
let redisInitialized = false;

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
  const adminAuthRedirect = await checkAdminAuth(request);
  if (adminAuthRedirect) {
    return adminAuthRedirect;
  }

  // Initialize Redis cache system on first request
  if (!redisInitialized && process.env.NODE_ENV !== 'development') {
    try {
      await initRedisCacheSystem();
      redisInitialized = true;
      logger.info('Redis cache system initialized via middleware');
    } catch (error) {
      logger.error('Failed to initialize Redis cache system in middleware:', error);
    }
  }

  if (!isCspEnforced || !shouldApplyCsp(request)) {
    return NextResponse.next();
  }

  const nonce = createNonce();
  const cspHeader = buildCspHeader(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Reporting-Endpoints', REPORTING_ENDPOINTS_HEADER);

  return response;
}

/**
 * Configure middleware matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/ (public folder, anchored as a path prefix so paths that
     *   merely contain "public", e.g. /properties/public-square, still
     *   get CSP headers)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
