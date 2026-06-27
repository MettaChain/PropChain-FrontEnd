/**
 * Redis Client Configuration and Connection
 * Handles Redis connection setup and client management for caching
 */

import Redis from 'ioredis';
import { logger } from '@/utils/logger';

// Redis configuration
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  connectTimeout: number;
  commandTimeout: number;
}

// Default Redis configuration
const DEFAULT_REDIS_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Redis client instance
let redisClient: Redis | null = null;

/**
 * Get Redis configuration from environment variables
 */
export const getRedisConfig = (): RedisConfig => {
  return {
    ...DEFAULT_REDIS_CONFIG,
    // Override with environment variables if present
    host: process.env.REDIS_HOST || DEFAULT_REDIS_CONFIG.host,
    port: parseInt(process.env.REDIS_PORT || DEFAULT_REDIS_CONFIG.port.toString()),
    password: process.env.REDIS_PASSWORD || DEFAULT_REDIS_CONFIG.password,
    db: parseInt(process.env.REDIS_DB || DEFAULT_REDIS_CONFIG.db.toString()),
  };
};

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<Redis> => {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  try {
    const config = getRedisConfig();
    
    redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryDelayOnFailover: config.retryDelayOnFailover,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      lazyConnect: config.lazyConnect,
      keepAlive: config.keepAlive,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      // Enable key prefixing for property cache
      keyPrefix: 'propchain:',
      // Enable compression for large values
      enableAutoPipelining: true,
      // Connection events
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    });

    // Event listeners
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection established successfully');

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis connection:', error);
    throw error;
  }
};

/**
 * Get Redis client (creates connection if needed)
 */
export const getRedisClient = async (): Promise<Redis> => {
  if (!redisClient) {
    return await initRedis();
  }
  
  if (redisClient.status !== 'ready') {
    // Try to reconnect
    try {
      await redisClient.connect();
    } catch (error) {
      logger.error('Failed to reconnect to Redis:', error);
      // Create new client
      return await initRedis();
    }
  }
  
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
};

/**
 * Check Redis connection status
 */
export const isRedisConnected = (): boolean => {
  return redisClient?.status === 'ready';
};

/**
 * Test Redis connection
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
};

/**
 * Get Redis info and statistics
 */
export const getRedisInfo = async (): Promise<Record<string, any> | null> => {
  try {
    const client = await getRedisClient();
    const info = await client.info();
    
    // Parse Redis info string into object
    const infoLines = info.split('\r\n');
    const infoObj: Record<string, any> = {};
    
    for (const line of infoLines) {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          infoObj[key] = valueParts.join(':');
        }
      }
    }
    
    return infoObj;
  } catch (error) {
    logger.error('Failed to get Redis info:', error);
    return null;
  }
};

export default redisClient;
