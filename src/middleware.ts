/**
 * Next.js Middleware for Redis Cache Initialization and CSP enforcement
 * Initializes Redis caching system and applies nonce-based CSP when enabled
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initRedisCacheSystem } from '@/lib/initRedisCache';
import { logger } from '@/utils/logger';

const isDev = process.env.NODE_ENV === 'development';
const isCspEnforced = process.env.CSP_ENFORCE === 'true';

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
    "report-uri /api/csp-report",
  ];

  if (!isDev) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
};

const shouldApplyCsp = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api') || pathname === '/sw.js') {
    return false;
  }

  const acceptHeader = request.headers.get('accept') || '';
  return acceptHeader.includes('text/html');
};

// Flag to track if Redis has been initialized
let redisInitialized = false;

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
