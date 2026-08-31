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

const ipStore: RateLimitStore = {};
const walletStore: RateLimitStore = {};

let cleanupIntervalHandle: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer(): void {
  if (cleanupIntervalHandle !== null) {
    clearInterval(cleanupIntervalHandle);
  }

  cleanupIntervalHandle = setInterval(() => {
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
  }, 60000);
}

startCleanupTimer();

export function stopRateLimitCleanup(): void {
  if (cleanupIntervalHandle !== null) {
    clearInterval(cleanupIntervalHandle);
    cleanupIntervalHandle = null;
  }
}

function getRateLimitData(store: RateLimitStore, key: string, windowMs: number): {
  count: number;
  resetTime: number;
} {
  const now = Date.now();
  const existing = store[key];

  if (existing && existing.resetTime > now) {
    return {
      count: existing.count + 1,
      resetTime: existing.resetTime,
    };
  }

  return {
    count: 1,
    resetTime: now + windowMs,
  };
}

function updateRateLimitStore(store: RateLimitStore, key: string, data: {
  count: number;
  resetTime: number;
}): void {
  store[key] = data;
}

let redisClient: {
  zadd: (key: string, scoreMember: { score: number; member: string }) => Promise<number>;
  zremrangebyscore: (key: string, min: string, max: string) => Promise<number>;
  zcount: (key: string, min: string, max: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
} | null = null;

let redisAvailable = false;

async function initRedis(): Promise<void> {
  if (redisClient !== null || redisAvailable) {
    return;
  }

  const env = validateEnv();
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token });
    redisAvailable = true;
  } catch {
    redisAvailable = false;
  }
}

async function slidingWindowLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<{ count: number; resetTime: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const resetTime = now + windowMs;

  await initRedis();

  if (redisAvailable && redisClient) {
    try {
      await redisClient.zremrangebyscore(key, '-inf', windowStart.toString());
      const count = await redisClient.zcount(key, windowStart.toString(), now.toString());

      if (count < maxRequests) {
        await redisClient.zadd(key, { score: now, member: `${now}-${Math.random()}` });
        await redisClient.expire(key, Math.ceil(windowMs / 1000) + 1);
      }

      return { count: count + (count < maxRequests ? 1 : 0), resetTime };
    } catch {
      redisAvailable = false;
      redisClient = null;
    }
  }

  const store = key.includes('ip:') ? ipStore : walletStore;
  const data = getRateLimitData(store, key, windowMs);
  if (data.count <= maxRequests) {
    updateRateLimitStore(store, key, data);
  }
  return data;
}

export async function rateLimitByIP(request: NextRequest): Promise<RateLimitResult> {
  const env = validateEnv();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS;

  const ip = (request as NextRequest & { ip?: string }).ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `rl:ip:${ip}`;
  const data = await slidingWindowLimit(key, windowMs, maxRequests);
  const remaining = Math.max(0, maxRequests - data.count);
  const success = data.count <= maxRequests;

  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: data.resetTime,
    retryAfter: success ? undefined : Math.ceil((data.resetTime - Date.now()) / 1000),
  };
}

export async function rateLimitByWallet(request: NextRequest): Promise<RateLimitResult> {
  const env = validateEnv();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS_PER_WALLET;

  const walletAddress = request.headers.get('x-wallet-address') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    null;

  if (!walletAddress) {
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
    };
  }

  const key = `rl:wallet:${walletAddress}`;
  const data = await slidingWindowLimit(key, windowMs, maxRequests);
  const remaining = Math.max(0, maxRequests - data.count);
  const success = data.count <= maxRequests;

  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: data.resetTime,
    retryAfter: success ? undefined : Math.ceil((data.resetTime - Date.now()) / 1000),
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
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers,
      },
    );
  }

  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers,
    },
  );
}

export function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ipRateLimit = await rateLimitByIP(request);
    if (!ipRateLimit.success) {
      return createRateLimitResponse(ipRateLimit);
    }

    const walletRateLimit = await rateLimitByWallet(request);
    if (!walletRateLimit.success) {
      return createRateLimitResponse(walletRateLimit);
    }

    const response = await handler(request);

    response.headers.set('X-RateLimit-Limit', ipRateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', ipRateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(ipRateLimit.resetTime).toISOString());

    return response;
  };
}