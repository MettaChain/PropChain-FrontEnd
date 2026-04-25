import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from '@/config/env/schema';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const ipStore: RateLimitStore = {};
const walletStore: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(ipStore).forEach(key => {
    if (ipStore[key].resetTime <= now) {
      delete ipStore[key];
    }
  });
  Object.keys(walletStore).forEach(key => {
    if (walletStore[key].resetTime <= now) {
      delete walletStore[key];
    }
  });
}, 60000); // Clean up every minute

function getRateLimitData(store: RateLimitStore, key: string, windowMs: number): {
  count: number;
  resetTime: number;
} {
  const now = Date.now();
  const existing = store[key];
  
  if (existing && existing.resetTime > now) {
    return {
      count: existing.count + 1,
      resetTime: existing.resetTime
    };
  }
  
  return {
    count: 1,
    resetTime: now + windowMs
  };
}

function updateRateLimitStore(store: RateLimitStore, key: string, data: {
  count: number;
  resetTime: number;
}): void {
  store[key] = data;
}

export function rateLimitByIP(request: NextRequest): RateLimitResult {
  const env = validateEnv();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS;
  
  const ip = (request as any).ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  const data = getRateLimitData(ipStore, ip, windowMs);
  const remaining = Math.max(0, maxRequests - data.count);
  const success = data.count <= maxRequests;
  
  if (success) {
    updateRateLimitStore(ipStore, ip, data);
  }
  
  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: data.resetTime,
    retryAfter: success ? undefined : Math.ceil((data.resetTime - Date.now()) / 1000)
  };
}

export function rateLimitByWallet(request: NextRequest): RateLimitResult {
  const env = validateEnv();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS_PER_WALLET;
  
  // Get wallet address from Authorization header or custom header
  const walletAddress = request.headers.get('x-wallet-address') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    null;
  
  if (!walletAddress) {
    // No wallet address provided, return success with default limits
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs
    };
  }
  
  const data = getRateLimitData(walletStore, walletAddress, windowMs);
  const remaining = Math.max(0, maxRequests - data.count);
  const success = data.count <= maxRequests;
  
  if (success) {
    updateRateLimitStore(walletStore, walletAddress, data);
  }
  
  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: data.resetTime,
    retryAfter: success ? undefined : Math.ceil((data.resetTime - Date.now()) / 1000)
  };
}

export function createRateLimitResponse(rateLimitResult: RateLimitResult): NextResponse {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
  };
  
  if (!rateLimitResult.success && rateLimitResult.retryAfter) {
    headers['Retry-After'] = rateLimitResult.retryAfter.toString();
    
    return NextResponse.json(
      { 
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      },
      { 
        status: 429,
        headers
      }
    );
  }
  
  return NextResponse.json(
    { success: true },
    { 
      status: 200,
      headers
    }
  );
}

export function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check IP-based rate limit
    const ipRateLimit = rateLimitByIP(request);
    if (!ipRateLimit.success) {
      return createRateLimitResponse(ipRateLimit);
    }
    
    // Check wallet-based rate limit if wallet address is provided
    const walletRateLimit = rateLimitByWallet(request);
    if (!walletRateLimit.success) {
      return createRateLimitResponse(walletRateLimit);
    }
    
    // Proceed with the actual handler
    const response = await handler(request);
    
    // Add rate limit headers to the response
    response.headers.set('X-RateLimit-Limit', ipRateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', ipRateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(ipRateLimit.resetTime).toISOString());
    
    return response;
  };
}
