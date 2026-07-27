# Cache Manager API

This document summarizes the public API surface of the cache manager.

## Functions

- `initCacheManager()`: Initializes the cache manager.
- `addNetworkStateListener(listener)`: Adds a listener for network state changes.
- `isNetworkOnline()`: Checks if the network is currently online.
- `getLastSyncTime()`: Gets the timestamp of the last successful sync.
- `performBackgroundSync()`: Performs a background sync.
- `addToSyncQueue(type, payload)`: Adds an item to the sync queue.
- `getSyncQueueLength()`: Gets the number of items in the sync queue.
- `clearSyncQueue()`: Clears the sync queue.
- `registerVersionMigration(version, handler)`: Registers a migration handler for a specific cache version.
- `getCacheVersion()`: Gets the current version of the cache.
- `onMutation(mutationType, handler)`: Registers a listener for a specific mutation type.
- `triggerMutation(mutationType, payload, invalidationPatterns)`: Triggers a mutation and invalidates the cache.
- `invalidateCache(pattern)`: Invalidates cache entries that match a given regex pattern.
- `invalidateAllCache()`: Invalidates the entire cache.
- `getCacheHealth()`: Gets the health status of the cache.
- `optimizeCache()`: Optimizes the cache by cleaning up expired entries.
- `exportCacheData()`: Exports the cache data to a JSON string.
- `importCacheData(jsonData)`: Imports cache data from a JSON string.
- `createCachedFetch(fetcher, key, strategy, ttl)`: Creates a cached fetch wrapper that supports different caching strategies.
