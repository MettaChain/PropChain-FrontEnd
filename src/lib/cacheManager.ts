/**
 * Cache Manager
 * Centralized cache management with synchronization, invalidation, and storage management
 */

import { logger } from '@/utils/logger';
import type {
  CacheConfig,
  CacheStats,
  CacheStrategy,
  CacheResult,
  CacheEvent,
} from '@/types/cache';
import {
  DEFAULT_CACHE_CONFIG,
  LOCAL_STORAGE_KEYS,
} from '@/types/cache';
import {
  getCacheConfig,
  setCacheConfig,
  getCacheStats,
  updateCacheStats,
  cleanupExpiredEntries,
  clearAllCachedProperties,
  addCacheEventListener,
  isCacheAvailable,
  initPropertyCache,
} from './propertyCache';

// Sync queue for offline operations
interface SyncQueueItem {
  id: string;
  type: 'property-update' | 'property-delete' | 'search-update';
  payload: unknown;
  timestamp: number;
  retries: number;
}

// Cache manager state
let isInitialized = false;
let isOnline = true;
let syncInProgress = false;
let lastSyncTime = 0;

// Event listeners
const stateChangeListeners: Set<(online: boolean) => void> = new Set();

/**
 * Initialize the cache manager
 */
export const initCacheManager = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // Initialize property cache
    await initPropertyCache();

    // Set up online/offline detection
    setupNetworkListeners();

    // Load last sync time
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC);
      if (stored) {
        lastSyncTime = parseInt(stored, 10);
      }
    }

    // Perform initial sync if online
    if (isOnline) {
      await performBackgroundSync();
    }

    isInitialized = true;
    logger.info('Cache manager initialized');
  } catch (error) {
    logger.error('Error initializing cache manager:', error);
    throw error;
  }
};

/**
 * Set up network state listeners
 */
const setupNetworkListeners = (): void => {
  if (typeof window === 'undefined') return;

  isOnline = navigator.onLine;

  const handleOnline = () => {
    isOnline = true;
    stateChangeListeners.forEach((listener) => listener(true));
    logger.info('Connection restored, triggering sync');
    performBackgroundSync();
  };

  const handleOffline = () => {
    isOnline = false;
    stateChangeListeners.forEach((listener) => listener(false));
    logger.info('Connection lost, switching to offline mode');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
};

/**
 * Add network state change listener
 */
export const addNetworkStateListener = (
  listener: (online: boolean) => void
): (() => void) => {
  stateChangeListeners.add(listener);
  return () => {
    stateChangeListeners.delete(listener);
  };
};

/**
 * Check if currently online
 */
export const isNetworkOnline = (): boolean => isOnline;

/**
 * Get the last sync timestamp
 */
export const getLastSyncTime = (): number => lastSyncTime;

/**
 * Perform background synchronization
 */
export const performBackgroundSync = async (): Promise<void> => {
  if (syncInProgress || !isOnline) return;

  syncInProgress = true;

  try {
    // Clean up expired entries first
    const cleanedCount = await cleanupExpiredEntries();
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired cache entries`);
    }

    // Process sync queue
    await processSyncQueue();

    // Update cache stats
    await updateCacheStats();

    // Update last sync time
    lastSyncTime = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.LAST_SYNC,
        lastSyncTime.toString()
      );
    }

    logger.info('Background sync completed');
  } catch (error) {
    logger.error('Error during background sync:', error);
  } finally {
    syncInProgress = false;
  }
};

/**
 * Process the sync queue
 * Reads pending operations from localStorage, attempts each one, and
 * retries failed items up to 3 times before dropping them.
 */
const processSyncQueue = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const queueJson = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE);
    if (!queueJson) return;

    const queue: SyncQueueItem[] = JSON.parse(queueJson);
    if (queue.length === 0) return;

    logger.info(`Processing ${queue.length} sync queue items`);

    const processedIds: string[] = [];
    const failedItems: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        // Attempt to sync this item with the server
        await processSyncItem(item);
        processedIds.push(item.id);
      } catch (error) {
        logger.error(`Failed to process sync item ${item.id}:`, error);
        
        // Exponential back-off would be ideal here; for now we cap at 3 retries
        if (item.retries < 3) {
          failedItems.push({
            ...item,
            retries: item.retries + 1, // Increment retry counter for next attempt
          });
        }
        // Items exceeding 3 retries are silently dropped to prevent queue bloat
      }
    }

    // Persist only the items that still need processing (failed + not yet attempted)
    const remainingQueue = queue.filter(
      (item) => !processedIds.includes(item.id) || failedItems.some((f) => f.id === item.id)
    );

    localStorage.setItem(
      LOCAL_STORAGE_KEYS.SYNC_QUEUE,
      JSON.stringify(remainingQueue)
    );

    logger.info(`Sync queue processed: ${processedIds.length} succeeded, ${failedItems.length} failed`);
  } catch (error) {
    logger.error('Error processing sync queue:', error);
  }
};

/**
 * Process a single sync item
 */
const processSyncItem = async (item: SyncQueueItem): Promise<void> => {
  // This would integrate with your actual API
  // For now, it's a placeholder for the sync logic
  switch (item.type) {
    case 'property-update':
      // await api.updateProperty(item.payload);
      break;
    case 'property-delete':
      // await api.deleteProperty(item.payload);
      break;
    case 'search-update':
      // await api.updateSearch(item.payload);
      break;
    default:
      logger.warn('Unknown sync item type:', item.type);
  }
};

/**
 * Add item to sync queue
 * Generates a unique ID using timestamp + random suffix to avoid collisions
 * even when multiple items are queued within the same millisecond.
 */
export const addToSyncQueue = (
  type: SyncQueueItem['type'],
  payload: unknown
): void => {
  if (typeof window === 'undefined') return;

  try {
    const queueJson = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE);
    const queue: SyncQueueItem[] = queueJson ? JSON.parse(queueJson) : [];

    const newItem: SyncQueueItem = {
      // Combine timestamp with random base-36 string for a unique, sortable ID
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0, // Fresh item — no retries yet
    };

    queue.push(newItem);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

    logger.info(`Added item to sync queue: ${newItem.id}`);
  } catch (error) {
    logger.error('Error adding to sync queue:', error);
  }
};

/**
 * Get sync queue length
 */
export const getSyncQueueLength = (): number => {
  if (typeof window === 'undefined') return 0;

  try {
    const queueJson = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE);
    if (!queueJson) return 0;
    const queue: SyncQueueItem[] = JSON.parse(queueJson);
    return queue.length;
  } catch {
    return 0;
  }
};

/**
 * Clear the sync queue
 */
export const clearSyncQueue = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE);
  logger.info('Sync queue cleared');
};

/**
 * Invalidate cache entries by pattern
 */
export const invalidateCache = async (pattern: RegExp): Promise<number> => {
  try {
    const { getAllCachedPropertyIds, deleteCachedProperty } = await import(
      './propertyCache'
    );
    
    const propertyIds = await getAllCachedPropertyIds();
    const matchingIds = propertyIds.filter((id) => pattern.test(id));

    await Promise.all(matchingIds.map((id) => deleteCachedProperty(id)));

    logger.info(`Invalidated ${matchingIds.length} cache entries matching pattern`);
    return matchingIds.length;
  } catch (error) {
    logger.error('Error invalidating cache:', error);
    return 0;
  }
};

/**
 * Invalidate all cache
 */
export const invalidateAllCache = async (): Promise<void> => {
  try {
    await clearAllCachedProperties();
    clearSyncQueue();
    logger.info('All cache invalidated');
  } catch (error) {
    logger.error('Error invalidating all cache:', error);
    throw error;
  }
};

/**
 * Get cache health status
 */
export const getCacheHealth = async (): Promise<{
  healthy: boolean;
  issues: string[];
  stats: CacheStats;
}> => {
  const issues: string[] = [];
  const stats = await updateCacheStats();

  // Check storage usage
  if (stats.storageQuota > 0) {
    const usagePercent = (stats.storageUsed / stats.storageQuota) * 100;
    if (usagePercent > 90) {
      issues.push(`Storage usage critical: ${usagePercent.toFixed(1)}%`);
    } else if (usagePercent > 75) {
      issues.push(`Storage usage high: ${usagePercent.toFixed(1)}%`);
    }
  }

  // Check cache size
  const config = getCacheConfig();
  if (stats.totalSize > config.maxSize * 0.9) {
    issues.push('Cache size approaching limit');
  }

  // Check hit rate
  if (stats.hitRate < 0.3 && stats.totalEntries > 10) {
    issues.push('Cache hit rate is low');
  }

  // Check for stale entries
  if (stats.oldestEntry) {
    const age = Date.now() - stats.oldestEntry;
    if (age > config.ttl * 2) {
      issues.push('Very old cache entries detected');
    }
  }

  // Check sync queue
  const queueLength = getSyncQueueLength();
  if (queueLength > 10) {
    issues.push(`Sync queue has ${queueLength} pending items`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    stats,
  };
};

/**
 * Optimize cache storage
 */
export const optimizeCache = async (): Promise<{
  cleaned: number;
  freed: number;
}> => {
  try {
    const beforeStats = await updateCacheStats();
    
    // Clean expired entries
    const cleaned = await cleanupExpiredEntries();
    
    // Get updated stats
    const afterStats = await updateCacheStats();
    const freed = beforeStats.totalSize - afterStats.totalSize;

    logger.info(`Cache optimized: ${cleaned} entries cleaned, ${freed} bytes freed`);

    return { cleaned, freed };
  } catch (error) {
    logger.error('Error optimizing cache:', error);
    return { cleaned: 0, freed: 0 };
  }
};

/**
 * Export cache data for backup
 */
export const exportCacheData = async (): Promise<string> => {
  try {
    const { getAllCachedProperties, getAllCachedMobileProperties } = await import(
      './propertyCache'
    );

    const properties = await getAllCachedProperties();
    const mobileProperties = await getAllCachedMobileProperties();

    const exportData = {
      version: 1,
      exportedAt: Date.now(),
      properties,
      mobileProperties,
      stats: getCacheStats(),
    };

    return JSON.stringify(exportData);
  } catch (error) {
    logger.error('Error exporting cache data:', error);
    throw error;
  }
};

/**
 * Import cache data from backup
 */
export const importCacheData = async (jsonData: string): Promise<void> => {
  try {
    const data = JSON.parse(jsonData);

    if (data.version !== 1) {
      throw new Error(`Unsupported cache export version: ${data.version}`);
    }

    const { setCachedProperty, setCachedMobileProperty } = await import(
      './propertyCache'
    );

    // Import properties
    if (data.properties) {
      for (const entry of data.properties) {
        await setCachedProperty(entry.data);
      }
    }

    // Import mobile properties
    if (data.mobileProperties) {
      for (const entry of data.mobileProperties) {
        await setCachedMobileProperty(entry.data);
      }
    }

    logger.info('Cache data imported successfully');
  } catch (error) {
    logger.error('Error importing cache data:', error);
    throw error;
  }
};

/**
 * Create a cached fetch wrapper
 * Supports five caching strategies:
 *   - cache-first: serve cache, fall back to network on miss/stale
 *   - network-first: always try network, fall back to stale cache on failure
 *   - stale-while-revalidate: serve stale cache immediately, refresh in background
 *   - cache-only: never hit the network (useful for offline-only data)
 *   - network-only: never use cache (always fresh)
 */
export const createCachedFetch = <T>(
  fetcher: () => Promise<T>,
  key: string,
  strategy: CacheStrategy = 'stale-while-revalidate',
  ttl?: number
) => {
  return async (): Promise<CacheResult<T>> => {
    const { getCachedProperty, setCachedProperty } = await import(
      './propertyCache'
    );

    switch (strategy) {
      case 'cache-first': {
        // Return cached data immediately if it's fresh; only hit network on miss
        const cached = await getCachedProperty(key);
        if (cached.data && !cached.stale) {
          return cached as CacheResult<T>;
        }
        try {
          const data = await fetcher();
          await setCachedProperty(data as unknown as import('@/types/property').Property);
          return { data, source: 'network', stale: false };
        } catch (error) {
          // Network failed — return stale cache rather than throwing
          if (cached.data) {
            return { ...cached, stale: true } as CacheResult<T>;
          }
          throw error;
        }
      }

      case 'network-first': {
        // Always prefer fresh data; only use cache when network is unavailable
        try {
          const data = await fetcher();
          await setCachedProperty(data as unknown as import('@/types/property').Property);
          return { data, source: 'network', stale: false };
        } catch (error) {
          const cached = await getCachedProperty(key);
          if (cached.data) {
            return { ...cached, stale: true } as CacheResult<T>;
          }
          throw error;
        }
      }

      case 'stale-while-revalidate': {
        const cached = await getCachedProperty(key);
        
        // Serve fresh cache immediately without waiting for network
        if (cached.data && !cached.stale) {
          return cached as CacheResult<T>;
        }

        // Kick off a background refresh so the next request gets fresh data,
        // but don't block the current response on it
        if (isOnline) {
          fetcher()
            .then((data) =>
              setCachedProperty(data as unknown as import('@/types/property').Property)
            )
            .catch((error) => logger.error('Background refresh failed:', error));
        }

        // Return stale data while the background refresh runs
        if (cached.data) {
          return { ...cached, stale: true } as CacheResult<T>;
        }

        // No cache at all — must wait for network
        const data = await fetcher();
        await setCachedProperty(data as unknown as import('@/types/property').Property);
        return { data, source: 'network', stale: false };
      }

      case 'cache-only': {
        // Never hit the network — useful for data that should only come from cache
        const cached = await getCachedProperty(key);
        return cached as CacheResult<T>;
      }

      case 'network-only': {
        // Bypass cache entirely — always fetch fresh data
        const data = await fetcher();
        return { data, source: 'network', stale: false };
      }

      default:
        throw new Error(`Unknown cache strategy: ${strategy}`);
    }
  };
};

// Re-export cache functions
export {
  getCacheConfig,
  setCacheConfig,
  getCacheStats,
  updateCacheStats,
  cleanupExpiredEntries,
  clearAllCachedProperties,
  addCacheEventListener,
  isCacheAvailable,
  initPropertyCache,
};

// Default export
export default {
  init: initCacheManager,
  isOnline: isNetworkOnline,
  getLastSyncTime,
  performSync: performBackgroundSync,
  addToSyncQueue,
  getSyncQueueLength,
  clearSyncQueue,
  invalidateCache,
  invalidateAll: invalidateAllCache,
  getHealth: getCacheHealth,
  optimize: optimizeCache,
  exportData: exportCacheData,
  importData: importCacheData,
  createCachedFetch,
};
