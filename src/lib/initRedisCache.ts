/**
 * Redis Cache Initialization
 * Sets up Redis caching and blockchain event listeners on application startup
 */

import { initRedis, testRedisConnection } from './redis';
import { redisCacheService } from './redisCache';
import { blockchainCacheInvalidator } from './blockchainCacheInvalidator';
import { logger } from '@/utils/logger';

/**
 * Initialize Redis caching system
 */
export const initRedisCacheSystem = async (): Promise<void> => {
  try {
    logger.info('Initializing Redis cache system...');

    // Test Redis connection first
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      logger.warn('Redis connection failed, Redis caching will be disabled');
      return;
    }

    // Initialize Redis client
    await initRedis();
    logger.info('Redis client initialized');

    // Test Redis cache service
    const healthCheck = await redisCacheService.healthCheck();
    if (!healthCheck.healthy) {
      logger.warn('Redis cache service health check failed');
      return;
    }

    logger.info(`Redis cache service healthy (latency: ${healthCheck.latency}ms)`);

    // Initialize blockchain cache invalidator if environment is configured
    if (process.env.PROPERTY_CONTRACT_ADDRESS && process.env.BLOCKCHAIN_RPC_URL) {
      try {
        await blockchainCacheInvalidator.start();
        logger.info('Blockchain cache invalidator started');
      } catch (error) {
        logger.warn('Failed to start blockchain cache invalidator:', error);
      }
    } else {
      logger.info('Blockchain contract not configured, skipping blockchain event listeners');
    }

    // Set up periodic cache health checks
    setInterval(async () => {
      try {
        const health = await redisCacheService.healthCheck();
        if (!health.healthy) {
          logger.warn('Redis cache health check failed:', health.error);
        }
      } catch (error) {
        logger.error('Error during periodic health check:', error);
      }
    }, 60000); // Check every minute

    logger.info('Redis cache system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis cache system:', error);
  }
};

/**
 * Graceful shutdown of Redis cache system
 */
export const shutdownRedisCacheSystem = async (): Promise<void> => {
  try {
    logger.info('Shutting down Redis cache system...');

    // Stop blockchain cache invalidator
    try {
      await blockchainCacheInvalidator.stop();
      logger.info('Blockchain cache invalidator stopped');
    } catch (error) {
      logger.error('Error stopping blockchain cache invalidator:', error);
    }

    // Close Redis connection
    try {
      const { closeRedisConnection } = await import('./redis');
      await closeRedisConnection();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }

    logger.info('Redis cache system shut down successfully');
  } catch (error) {
    logger.error('Error during Redis cache system shutdown:', error);
  }
};

/**
 * Get Redis cache system status
 */
export const getRedisCacheSystemStatus = async (): Promise<{
  redisConnected: boolean;
  cacheHealthy: boolean;
  blockchainListenerActive: boolean;
  stats?: any;
}> => {
  try {
    const redisConnected = await testRedisConnection();
    const healthCheck = await redisCacheService.healthCheck();
    const blockchainStats = await blockchainCacheInvalidator.getStats();
    const cacheStats = await redisCacheService.getStats();

    return {
      redisConnected,
      cacheHealthy: healthCheck.healthy,
      blockchainListenerActive: blockchainStats.isListening,
      stats: {
        latency: healthCheck.latency,
        cacheHitRate: cacheStats?.hitRate || 0,
        blockchainQueueLength: blockchainStats.queueLength,
      },
    };
  } catch (error) {
    logger.error('Error getting Redis cache system status:', error);
    return {
      redisConnected: false,
      cacheHealthy: false,
      blockchainListenerActive: false,
    };
  }
};

export default {
  init: initRedisCacheSystem,
  shutdown: shutdownRedisCacheSystem,
  getStatus: getRedisCacheSystemStatus,
};
