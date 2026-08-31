/**
 * Cache Manager
 * Centralized cache management with synchronization, invalidation, versioning, and LRU eviction
 */

import { logger } from "@/utils/logger";
import type {
  CacheConfig,
  CacheStats,
  CacheStrategy,
  CacheResult,
  CacheEvent,
} from "@/types/cache";
import { DEFAULT_CACHE_CONFIG, LOCAL_STORAGE_KEYS } from "@/types/cache";
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
} from "./propertyCache";
import { genId } from "@/utils/genId";
import { generateSecureId } from "@/utils/secureId";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { sha256, toUtf8Bytes } from "ethers";

// Version migration handlers
type VersionMigration = (data: unknown) => unknown;
const versionMigrations: Map<number, VersionMigration> = new Map();

// Sync queue for offline operations
interface SyncQueueItem {
  id: string;
  type: "property-update" | "property-delete" | "search-update";
  payload: unknown;
  timestamp: number;
  retries: number;
}

// Cache manager state
let isInitialized = false;
let isOnline = true;
let syncInProgress = false;
let lastSyncTime = 0;
let cacheVersion = DEFAULT_CACHE_CONFIG.version;

// Event listeners
const stateChangeListeners: Set<(online: boolean) => void> = new Set();
const mutationListeners: Map<
  string,
  Set<(payload: unknown) => void>
> = new Map();

/**
 * Initializes the cache manager.
 * This function should be called once when the application starts.
 * It sets up the property cache, handles version migrations, and sets up network listeners.
 *
 * @returns {Promise<void>} A promise that resolves when the cache manager is initialized.
 * @throws {Error} If there is an error initializing the cache manager.
 * @example
 * await initCacheManager();
 */
export const initCacheManager = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // Initialize property cache
    await initPropertyCache();

    // Check and handle cache version migrations
    await handleCacheVersionMigration();

    // Set up online/offline detection
    setupNetworkListeners();

    // Load last sync time
    if (typeof window !== "undefined") {
      lastSyncTime = safeLocalStorage.getJSON<number>(
        LOCAL_STORAGE_KEYS.LAST_SYNC,
        0,
      );
    }

    // Perform initial sync if online
    if (isOnline) {
      await performBackgroundSync();
    }

    isInitialized = true;
    logger.info("Cache manager initialized");
  } catch (error) {
    logger.error("Error initializing cache manager:", error);
    throw error;
  }
};

/**
 * Set up network state listeners
 */
const setupNetworkListeners = (): void => {
  if (typeof window === "undefined") return;

  isOnline = navigator.onLine;

  const handleOnline = () => {
    isOnline = true;
    stateChangeListeners.forEach((listener) => listener(true));
    logger.info("Connection restored, triggering sync");
    performBackgroundSync();
  };

  const handleOffline = () => {
    isOnline = false;
    stateChangeListeners.forEach((listener) => listener(false));
    logger.info("Connection lost, switching to offline mode");
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
};

/**
 * Adds a listener for network state changes.
 *
 * @param {function(boolean): void} listener - The listener function to call when the network state changes.
 * @returns {function(): void} A function to remove the listener.
 * @example
 * const unsubscribe = addNetworkStateListener((isOnline) => {
 *  console.log(isOnline ? 'Online' : 'Offline');
 * });
 * // Later, to stop listening:
 * unsubscribe();
 */
export const addNetworkStateListener = (
  listener: (online: boolean) => void,
): (() => void) => {
  stateChangeListeners.add(listener);
  return () => {
    stateChangeListeners.delete(listener);
  };
};

/**
 * Checks if the network is currently online.
 *
 * @returns {boolean} `true` if the network is online, `false` otherwise.
 * @example
 * if (isNetworkOnline()) {
 *   console.log('Network is online');
 * }
 */
export const isNetworkOnline = (): boolean => isOnline;

/**
 * Gets the timestamp of the last successful sync.
 *
 * @returns {number} The timestamp of the last sync, or 0 if no sync has occurred.
 * @example
 * const lastSync = getLastSyncTime();
 * console.log(`Last synced at: ${new Date(lastSync).toLocaleString()}`);
 */
export const getLastSyncTime = (): number => lastSyncTime;

/**
 * Performs a background sync.
 * This function cleans up expired entries, processes the sync queue, and updates cache stats.
 * It will not run if a sync is already in progress or if the network is offline.
 *
 * @returns {Promise<void>} A promise that resolves when the sync is complete.
 * @example
 * await performBackgroundSync();
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
    if (typeof window !== "undefined") {
      safeLocalStorage.setJSON(LOCAL_STORAGE_KEYS.LAST_SYNC, lastSyncTime);
    }

    logger.info("Background sync completed");
  } catch (error) {
    logger.error("Error during background sync:", error);
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
  if (typeof window === "undefined") return;

  try {
    const queue = safeLocalStorage.getJSON<SyncQueueItem[]>(
      LOCAL_STORAGE_KEYS.SYNC_QUEUE,
      [],
    );
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
      (item) =>
        !processedIds.includes(item.id) ||
        failedItems.some((f) => f.id === item.id),
    );

    safeLocalStorage.setJSON(LOCAL_STORAGE_KEYS.SYNC_QUEUE, remainingQueue);

    logger.info(
      `Sync queue processed: ${processedIds.length} succeeded, ${failedItems.length} failed`,
    );
  } catch (error) {
    logger.error("Error processing sync queue:", error);
  }
};

/**
 * Process a single sync item
 */
const processSyncItem = async (item: SyncQueueItem): Promise<void> => {
  // This would integrate with your actual API
  // For now, it's a placeholder for the sync logic
  switch (item.type) {
    case "property-update":
      // await api.updateProperty(item.payload);
      break;
    case "property-delete":
      // await api.deleteProperty(item.payload);
      break;
    case "search-update":
      // await api.updateSearch(item.payload);
      break;
    default:
      logger.warn("Unknown sync item type:", item.type);
  }
};

/**
 * Adds an item to the sync queue.
 * The item will be processed the next time a background sync is performed.
 *
 * @param {SyncQueueItem['type']} type - The type of the sync item.
 * @param {unknown} payload - The payload of the sync item.
 * @example
 * addToSyncQueue('property-update', { id: 1, name: 'New Name' });
 */
export const addToSyncQueue = (
  type: SyncQueueItem["type"],
  payload: unknown,
): void => {
  if (typeof window === "undefined") return;

  try {
    const queue = safeLocalStorage.getJSON<SyncQueueItem[]>(
      LOCAL_STORAGE_KEYS.SYNC_QUEUE,
      [],
    );

    const canonicalPayload = JSON.stringify(payload);
    const itemHash = sha256(toUtf8Bytes(type + canonicalPayload));

    const isDuplicate = queue.some((item) => {
      const existingHash = sha256(
        toUtf8Bytes(item.type + JSON.stringify(item.payload)),
      );
      return existingHash === itemHash;
    });

    if (isDuplicate) {
      logger.info(`Duplicate item rejected from sync queue: ${type}`);
      return;
    }

    const newItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0, // Fresh item — no retries yet
    };

    queue.push(newItem);
    safeLocalStorage.setJSON(LOCAL_STORAGE_KEYS.SYNC_QUEUE, queue);

    logger.info(`Added item to sync queue: ${newItem.id}`);
  } catch (error) {
    logger.error("Error adding to sync queue:", error);
  }
};

/**
 * Gets the number of items in the sync queue.
 *
 * @returns {number} The number of items in the sync queue.
 * @example
 * const queueLength = getSyncQueueLength();
 * console.log(`There are ${queueLength} items in the sync queue.`);
 */
export const getSyncQueueLength = (): number => {
  if (typeof window === "undefined") return 0;

  try {
    const queue = safeLocalStorage.getJSON<SyncQueueItem[]>(
      LOCAL_STORAGE_KEYS.SYNC_QUEUE,
      [],
    );
    return queue.length;
  } catch {
    return 0;
  }
};

/**
 * Clears the sync queue, removing all pending items.
 *
 * @example
 * clearSyncQueue();
 */
export const clearSyncQueue = (): void => {
  if (typeof window === "undefined") return;
  safeLocalStorage.remove(LOCAL_STORAGE_KEYS.SYNC_QUEUE);
  logger.info("Sync queue cleared");
};

/**
 * Handle cache version migrations
 */
const handleCacheVersionMigration = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    const storedVersion = parseInt(
      localStorage.getItem(LOCAL_STORAGE_KEYS.CACHE_VERSION) || "0",
      10,
    );
    const currentVersion = DEFAULT_CACHE_CONFIG.version;

    if (storedVersion < currentVersion) {
      logger.info(
        `Migrating cache from v${storedVersion} to v${currentVersion}`,
      );

      // Run migrations for each version step
      for (let v = storedVersion + 1; v <= currentVersion; v++) {
        const migration = versionMigrations.get(v);
        if (migration) {
          try {
            // Get all cached data, migrate it, and clear cache
            const { getAllCachedProperties, getAllCachedMobileProperties } =
              await import("./propertyCache");

            const properties = await getAllCachedProperties();
            const mobileProperties = await getAllCachedMobileProperties();

            // Apply migration
            const migratedProperties = properties.map((entry) => ({
              ...entry,
              data: migration(entry.data) as never,
            }));
            const migratedMobileProperties = mobileProperties.map((entry) => ({
              ...entry,
              data: migration(entry.data) as never,
            }));

            // Re-store migrated data
            await clearAllCachedProperties();
            const { setCachedProperty, setCachedMobileProperty } =
              await import("./propertyCache");

            for (const entry of migratedProperties) {
              await setCachedProperty(entry.data);
            }
            for (const entry of migratedMobileProperties) {
              await setCachedMobileProperty(entry.data);
            }

            logger.info(`Migration to v${v} completed`);
          } catch (error) {
            logger.error(`Error running migration to v${v}:`, error);
          }
        }
      }

      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CACHE_VERSION,
        currentVersion.toString(),
      );
      cacheVersion = currentVersion;
    }
  } catch (error) {
    logger.error("Error handling cache version migration:", error);
  }
};

/**
 * Registers a migration handler for a specific cache version.
 *
 * @param {number} version - The version to register the handler for.
 * @param {function(unknown): unknown} handler - The migration handler function.
 * @example
 * registerVersionMigration(2, (data) => {
 *   // Migrate data to version 2
 *   return { ...data, newField: 'defaultValue' };
 * });
 */
export const registerVersionMigration = (
  version: number,
  handler: (data: unknown) => unknown,
): void => {
  versionMigrations.set(version, handler);
  logger.info(`Registered version migration for v${version}`);
};

/**
 * Gets the current version of the cache.
 *
 * @returns {number} The current cache version.
 * @example
 * const version = getCacheVersion();
 * console.log(`Cache version: ${version}`);
 */
export const getCacheVersion = (): number => cacheVersion;

/**
 * Registers a listener for a specific mutation type.
 *
 * @param {string} mutationType - The type of mutation to listen for.
 * @param {function(unknown): void} handler - The listener function to call when the mutation occurs.
 * @returns {function(): void} A function to remove the listener.
 * @example
 * const unsubscribe = onMutation('property-update', (payload) => {
 *  console.log('Property updated:', payload);
 * });
 * // Later, to stop listening:
 * unsubscribe();
 */
export const onMutation = (
  mutationType: string,
  handler: (payload: unknown) => void,
): (() => void) => {
  if (!mutationListeners.has(mutationType)) {
    mutationListeners.set(mutationType, new Set());
  }
  mutationListeners.get(mutationType)!.add(handler);

  // Return unsubscribe function
  return () => {
    mutationListeners.get(mutationType)?.delete(handler);
  };
};

/**
 * Triggers a mutation and invalidates the cache.
 *
 * @param {string} mutationType - The type of mutation to trigger.
 * @param {unknown} payload - The payload of the mutation.
 * @param {RegExp[]} [invalidationPatterns] - An optional array of regex patterns to invalidate in the cache.
 * @returns {Promise<void>} A promise that resolves when the mutation is triggered and the cache is invalidated.
 * @example
 * await triggerMutation('property-update', { id: 1, name: 'New Name' }, [/properties/]);
 */
export const triggerMutation = async (
  mutationType: string,
  payload: unknown,
  invalidationPatterns?: RegExp[],
): Promise<void> => {
  try {
    // Call all registered listeners
    const listeners = mutationListeners.get(mutationType);
    if (listeners) {
      listeners.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          logger.error(
            `Error calling mutation listener for ${mutationType}:`,
            error,
          );
        }
      });
    }

    // Invalidate cache based on patterns
    if (invalidationPatterns && invalidationPatterns.length > 0) {
      for (const pattern of invalidationPatterns) {
        await invalidateCache(pattern);
      }
    }

    // Track invalidation in stats
    const stats = await updateCacheStats();
    if (stats && "invalidationCount" in stats) {
      const event: CacheEvent = {
        type: "invalidate",
        key: mutationType,
        timestamp: Date.now(),
        reason: `Mutation: ${mutationType}`,
      };
      addCacheEventListener((listener) => {
        listener(event);
      });
    }

    logger.info(
      `Mutation triggered: ${mutationType}, invalidated cache patterns`,
    );
  } catch (error) {
    logger.error("Error triggering mutation:", error);
  }
};

/**
 * Invalidates cache entries that match a given regex pattern.
 *
 * @param {RegExp} pattern - The regex pattern to match against cache keys.
 * @returns {Promise<number>} A promise that resolves with the number of invalidated entries.
 * @example
 * const invalidatedCount = await invalidateCache(/properties/);
 * console.log(`Invalidated ${invalidatedCount} entries.`);
 */
export const invalidateCache = async (pattern: RegExp): Promise<number> => {
  try {
    const { getAllCachedPropertyIds, deleteCachedProperty } =
      await import("./propertyCache");

    const propertyIds = await getAllCachedPropertyIds();
    const matchingIds = propertyIds.filter((id) => pattern.test(id));

    await Promise.all(matchingIds.map((id) => deleteCachedProperty(id)));

    logger.info(
      `Invalidated ${matchingIds.length} cache entries matching pattern`,
    );
    return matchingIds.length;
  } catch (error) {
    logger.error("Error invalidating cache:", error);
    return 0;
  }
};

/**
 * Invalidates the entire cache, clearing all entries.
 *
 * @returns {Promise<void>} A promise that resolves when the cache is invalidated.
 * @example
 * await invalidateAllCache();
 */
export const invalidateAllCache = async (): Promise<void> => {
  try {
    await clearAllCachedProperties();
    clearSyncQueue();
    logger.info("All cache invalidated");
  } catch (error) {
    logger.error("Error invalidating all cache:", error);
    throw error;
  }
};

/**
 * Gets the health status of the cache.
 *
 * @returns {Promise<{healthy: boolean, issues: string[], stats: CacheStats}>} A promise that resolves with the cache health status.
 * @example
 * const health = await getCacheHealth();
 * if (!health.healthy) {
 *   console.warn('Cache is unhealthy:', health.issues);
 * }
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
    issues.push("Cache size approaching limit");
  }

  // Check hit rate
  if (stats.hitRate < 0.3 && stats.totalEntries > 10) {
    issues.push("Cache hit rate is low");
  }

  // Check for stale entries
  if (stats.oldestEntry) {
    const age = Date.now() - stats.oldestEntry;
    if (age > config.ttl * 2) {
      issues.push("Very old cache entries detected");
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
 * Optimizes the cache by cleaning up expired entries.
 *
 * @returns {Promise<{cleaned: number, freed: number}>} A promise that resolves with the number of cleaned entries and the amount of freed space in bytes.
 * @example
 * const { cleaned, freed } = await optimizeCache();
 * console.log(`Cleaned ${cleaned} entries and freed ${freed} bytes.`);
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

    logger.info(
      `Cache optimized: ${cleaned} entries cleaned, ${freed} bytes freed`,
    );

    return { cleaned, freed };
  } catch (error) {
    logger.error("Error optimizing cache:", error);
    return { cleaned: 0, freed: 0 };
  }
};

/**
 * Exports the cache data to a JSON string.
 *
 * @returns {Promise<string>} A promise that resolves with the JSON string representation of the cache data.
 * @throws {Error} If there is an error exporting the cache data.
 * @example
 * const exportedData = await exportCacheData();
 * console.log(exportedData);
 */
export const exportCacheData = async (): Promise<string> => {
  try {
    const { getAllCachedProperties, getAllCachedMobileProperties } =
      await import("./propertyCache");

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
    logger.error("Error exporting cache data:", error);
    throw error;
  }
};

/**
 * Imports cache data from a JSON string.
 *
 * @param {string} jsonData - The JSON string representation of the cache data.
 * @returns {Promise<void>} A promise that resolves when the cache data is imported.
 * @throws {Error} If there is an error importing the cache data.
 * @example
 * const exportedData = await exportCacheData();
 * // ...
 * await importCacheData(exportedData);
 */
export const importCacheData = async (jsonData: string): Promise<void> => {
  try {
    const data = JSON.parse(jsonData);

    if (data.version !== 1) {
      throw new Error(`Unsupported cache export version: ${data.version}`);
    }

    const { setCachedProperty, setCachedMobileProperty } =
      await import("./propertyCache");

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

    logger.info("Cache data imported successfully");
  } catch (error) {
    logger.error("Error importing cache data:", error);
    throw error;
  }
};

/**
 * Creates a cached fetch wrapper that supports different caching strategies.
 *
 * @template T
 * @param {() => Promise<T>} fetcher - The function that fetches the data from the network.
 * @param {string} key - The cache key for the data.
 * @param {CacheStrategy} [strategy='stale-while-revalidate'] - The caching strategy to use.
 * @param {number} [ttl] - The time-to-live for the cached data in milliseconds.
 * @returns {() => Promise<CacheResult<T>>} A function that returns the cached or fetched data.
 * @example
 * const fetchUser = createCachedFetch(() => api.getUser(1), 'user-1');
 * const user = await fetchUser();
 */
export const createCachedFetch = <T>(
  fetcher: () => Promise<T>,
  key: string,
  strategy: CacheStrategy = "stale-while-revalidate",
  ttl?: number,
) => {
  return async (): Promise<CacheResult<T>> => {
    const { getCachedProperty, setCachedProperty } =
      await import("./propertyCache");

    switch (strategy) {
      case "cache-first": {
        // Return cached data immediately if it's fresh; only hit network on miss
        const cached = await getCachedProperty(key);
        if (cached.data && !cached.stale) {
          return cached as CacheResult<T>;
        }
        try {
          const data = await fetcher();
          await setCachedProperty(
            data as unknown as import("@/types/property").Property,
          );
          return { data, source: "network", stale: false };
        } catch (error) {
          // Network failed — return stale cache rather than throwing
          if (cached.data) {
            return { ...cached, stale: true } as CacheResult<T>;
          }
          throw error;
        }
      }

      case "network-first": {
        // Always prefer fresh data; only use cache when network is unavailable
        try {
          const data = await fetcher();
          await setCachedProperty(
            data as unknown as import("@/types/property").Property,
          );
          return { data, source: "network", stale: false };
        } catch (error) {
          const cached = await getCachedProperty(key);
          if (cached.data) {
            return { ...cached, stale: true } as CacheResult<T>;
          }
          throw error;
        }
      }

      case "stale-while-revalidate": {
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
              setCachedProperty(
                data as unknown as import("@/types/property").Property,
              ),
            )
            .catch((error) =>
              logger.error("Background refresh failed:", error),
            );
        }

        // Return stale data while the background refresh runs
        if (cached.data) {
          return { ...cached, stale: true } as CacheResult<T>;
        }

        // No cache at all — must wait for network
        const data = await fetcher();
        await setCachedProperty(
          data as unknown as import("@/types/property").Property,
        );
        return { data, source: "network", stale: false };
      }

      case "cache-only": {
        // Never hit the network — useful for data that should only come from cache
        const cached = await getCachedProperty(key);
        return cached as CacheResult<T>;
      }

      case "network-only": {
        // Bypass cache entirely — always fetch fresh data
        const data = await fetcher();
        return { data, source: "network", stale: false };
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
