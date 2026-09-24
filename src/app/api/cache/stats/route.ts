/**
 * Cache Statistics API Route
 * Provides Redis cache hit rate monitoring and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withCsrf } from '@/lib/csrf';
import { withRateLimit } from '@/lib/rateLimit';
import { redisCacheService } from '@/lib/redisCache';
import { getRedisInfo, testRedisConnection } from '@/lib/redis';
import { logger } from '@/utils/logger';

const ADMIN_API_KEY = process.env.CACHE_STATS_ADMIN_KEY;

// Constant-time comparison against a required admin key, same pattern used
// by the revalidate webhook (src/app/api/revalidate/route.ts).
function isAuthorized(request: NextRequest): boolean {
  if (!ADMIN_API_KEY) {
    return false;
  }

  const provided = request.headers.get('x-admin-api-key');
  if (!provided) {
    return false;
  }

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(ADMIN_API_KEY);

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

// GET handler for cache statistics
async function handleGet(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const detailed = searchParams.get('detailed') === 'true';

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    
    if (!redisConnected) {
      return NextResponse.json({
        error: 'Redis connection failed',
        connected: false,
        stats: null,
      }, { status: 503 });
    }

    // Get cache statistics
    const cacheStats = await redisCacheService.getStats();
    
    // Get Redis health check
    const healthCheck = await redisCacheService.healthCheck();
    
    // Get detailed Redis info if requested
    let redisInfo = null;
    if (detailed) {
      redisInfo = await getRedisInfo();
    }

    const response = {
      connected: true,
      healthy: healthCheck.healthy,
      latency: healthCheck.latency,
      cacheStats,
      timestamp: Date.now(),
    };

    if (detailed && redisInfo) {
      // Add relevant Redis metrics
      const redisMetrics = {
        usedMemory: redisInfo.used_memory_human,
        usedMemoryRss: redisInfo.used_memory_rss_human,
        usedMemoryPeak: redisInfo.used_memory_peak_human,
        connectedClients: redisInfo.connected_clients,
        totalCommandsProcessed: redisInfo.total_commands_processed,
        keyspaceHits: redisInfo.keyspace_hits,
        keyspaceMisses: redisInfo.keyspace_misses,
        uptimeInSeconds: redisInfo.uptime_in_seconds,
      };
      return NextResponse.json({ ...response, redisMetrics });
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in cache stats API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', connected: false },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGet);

// DELETE handler to clear cache statistics
export const DELETE = withCsrf(async function (request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await redisCacheService.clearStats();

    logger.info('Cache statistics cleared via API');

    return NextResponse.json({
      message: 'Cache statistics cleared successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error clearing cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

