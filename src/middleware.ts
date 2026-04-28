/**
 * Next.js Middleware for Redis Cache Initialization
 * Initializes Redis caching system for server-side requests
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initRedisCacheSystem } from '@/lib/initRedisCache';
import { logger } from '@/utils/logger';

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

  // Continue with the request
  return NextResponse.next();
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
