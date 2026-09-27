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

## Redis property cache invalidation (#1100)

The server-side property cache (`src/lib/redisCache.ts`) keeps a reverse index
per property: writing a detail, listing or search entry records its key under
`propchain:index:property:<id>`.

- `invalidateProperty(id)` reads that index and deletes only the keys that
  actually embed the property (its detail key plus any listing/search keys it
  appears in). The index set is then removed. When the index is missing it
  falls back to the previous narrow pattern scan.
- `invalidateAllProperties()` is now reserved for explicit full flushes (bulk
  imports, cache resets) and also clears the index sets.
- Blockchain events only flush `listing:*`/`search:*` for membership-changing
  events (`PropertyCreated`, `PropertyDelisted`); updates stay on the narrow
  index path.

### Hit-rate notes (before/after)

- **Before:** a single property update evicted every `property:*`, `listing:*`
  and `search:*` key, forcing a thundering-herd refetch of unrelated searches
  and detail pages. Measured effect on a warm cache: listing/search hit rate
  collapses toward 0% immediately after any mutation, then recovers as entries
  are rebuilt.
- **After:** only keys associated with the mutated property are evicted, so
  unrelated searches and detail pages keep serving from cache. Expected effect:
  listing/search hit rate now stays stable across mutations (only the mutated
  property's own entries miss and regenerate).
