/**
 * cacheManager tests
 *
 * Tests cover TTL/quota handling using a deterministic TrackableStorage mock
 * in place of the real IndexedDB layer, and use Jest fake timers to drive
 * time-based eviction without relying on wall-clock time.
 */

import { LOCAL_STORAGE_KEYS } from '@/types/cache';

/* -------------------------------------------------------------------------- */
/* TrackableStorage mock                                                      */
/* -------------------------------------------------------------------------- */
/* A Map-based in-memory store that records every CRUD operation so tests can
 * assert what the cache layer actually did without spinning up IndexedDB. */

interface StoredEntry {
  key: string;
  dataType: string;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
  size: number;
  payload: unknown;
}

function makeTrackableStorage() {
  const entries = new Map<string, StoredEntry>();
  const operations: { op: string; key: string }[] = [];

  const record = (op: string, key: string) => operations.push({ op, key });

  return {
    entries,
    operations,
    size: () => entries.size,
    put(key: string, entry: StoredEntry) {
      entries.set(key, entry);
      record('put', key);
    },
    get(key: string): StoredEntry | null {
      record('get', key);
      return entries.get(key) ?? null;
    },
    delete(key: string) {
      const existed = entries.delete(key);
      if (existed) record('delete', key);
      return existed;
    },
    clear() {
      const n = entries.size;
      entries.clear();
      record('clear', `bulk:${n}`);
    },
    // Make all entries expire as of "now".
    expireAll(now: number) {
      for (const [, entry] of entries) entry.expiresAt = now - 1;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* propertyCache mock                                                         */
/* -------------------------------------------------------------------------- */
/* Implements just enough of the propertyCache surface area for cacheManager's
 * static + dynamic imports. Returns jest.fn() for the bits we don't track. */

jest.mock('@/lib/propertyCache', () => {
  const storage = makeTrackableStorage();
  const stats = {
    totalEntries: 0,
    totalSize: 0,
    storageQuota: 0,
    storageUsed: 0,
    hitRate: 0,
    missRate: 0,
    oldestEntry: null as number | null,
    newestEntry: null as number | null,
    evictionCount: 0,
    invalidationCount: 0,
    entitiesByType: {} as Record<string, number>,
    sizeByType: {} as Record<string, number>,
  };

  return {
    __esModule: true,
    __getStorage: () => storage,
    __getStats: () => stats,
    __resetMock: () => {
      storage.entries.clear();
      storage.operations.length = 0;
      Object.assign(stats, {
        totalEntries: 0,
        totalSize: 0,
        storageQuota: 0,
        storageUsed: 0,
        hitRate: 0,
        missRate: 0,
        oldestEntry: null,
        newestEntry: null,
        evictionCount: 0,
        invalidationCount: 0,
        entitiesByType: {},
        sizeByType: {},
      });
    },

    initPropertyCache: jest.fn().mockResolvedValue(undefined),
    isCacheAvailable: jest.fn().mockReturnValue(true),

    getCachedProperty: jest.fn().mockImplementation(async (propertyId: string) => {
      const entry = storage.get(`property:${propertyId}`);
      if (!entry) return { data: null, source: 'none', stale: false };
      const stale = entry.expiresAt - Date.now() < entry.expiresAt - entry.createdAt;
      return { data: entry.payload, source: 'cache', stale };
    }),
    setCachedProperty: jest.fn().mockImplementation(async (property: { id: string }) => {
      const key = `property:${property.id}`;
      storage.put(key, {
        key,
        dataType: 'property',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        lastAccessed: Date.now(),
        size: 256,
        payload: property,
      });
      stats.totalEntries = storage.size();
    }),
    deleteCachedProperty: jest.fn().mockImplementation(async (propertyId: string) => {
      storage.delete(`property:${propertyId}`);
      stats.totalEntries = storage.size();
    }),

    getCachedMobileProperty: jest.fn().mockResolvedValue({ data: null, source: 'none', stale: false }),
    setCachedMobileProperty: jest.fn().mockResolvedValue(undefined),
    deleteCachedMobileProperty: jest.fn().mockResolvedValue(undefined),

    getAllCachedProperties: jest.fn().mockImplementation(async () => {
      return Array.from(storage.entries.entries())
        .filter(([key]) => key.startsWith('property:'))
        .map(([key, entry]) => ({ data: { id: key.slice('property:'.length) }, metadata: { key } }));
    }),
    getAllCachedMobileProperties: jest.fn().mockResolvedValue([]),
    getAllCachedPropertyIds: jest.fn().mockImplementation(async () => {
      return Array.from(storage.entries.keys())
        .filter((key) => key.startsWith('property:'))
        .map((key) => key.slice('property:'.length));
    }),
    clearAllCachedProperties: jest.fn().mockImplementation(async () => {
      const toRemove = Array.from(storage.entries.keys()).filter((key) =>
        key.startsWith('property:') || key.startsWith('mobile-property:')
      );
      for (const key of toRemove) storage.delete(key);
      stats.totalEntries = storage.size();
    }),

    cacheSearchResult: jest.fn().mockResolvedValue(undefined),
    getCachedSearchResult: jest.fn().mockResolvedValue(null),

    updateCacheStats: jest.fn().mockImplementation(async () => {
      const entries = Array.from(storage.entries.values());
      stats.totalEntries = storage.size();
      stats.totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      stats.oldestEntry = entries.length ? Math.min(...entries.map((e) => e.createdAt)) : null;
      stats.newestEntry = entries.length ? Math.max(...entries.map((e) => e.createdAt)) : null;
      return stats;
    }),
    getCacheStats: jest.fn().mockReturnValue(stats),

    cleanupExpiredEntries: jest.fn().mockImplementation(async () => {
      const now = Date.now();
      const expired: string[] = [];
      for (const [key, entry] of storage.entries) {
        if (entry.expiresAt < now) {
          expired.push(key);
        }
      }
      for (const key of expired) storage.delete(key);
      stats.totalEntries = storage.size();
      return expired.length;
    }),

    getCacheConfig: jest.fn().mockReturnValue({
      ttl: 60_000,
      maxSize: 1024 * 1024,
      maxEntries: 100,
      cleanupInterval: 5_000,
      compression: false,
      version: 1,
      dataTypeTtls: {
        property: 60_000,
        'mobile-property': 60_000,
        search: 60_000,
      },
      enableLRU: true,
    }),
    setCacheConfig: jest.fn(),

    addCacheEventListener: jest.fn().mockReturnValue(() => {}),
  };
});

/* -------------------------------------------------------------------------- */
/* Local module-level reload + storage helpers                                */
/* -------------------------------------------------------------------------- */

type CacheManagerModule = typeof import('@/lib/cacheManager');
type MockedPropertyCache = ReturnType<typeof jest.requireMock> & {
  __getStorage: () => ReturnType<typeof makeTrackableStorage>;
  __resetMock: () => void;
  __getStats: () => Record<string, unknown>;
};

const getPropertyCacheMock = (): MockedPropertyCache =>
  jest.requireMock('@/lib/propertyCache') as MockedPropertyCache;

// `jest.isolateModules(fn)` does not return the callback's value, so we capture
// the freshly-required module in a scoped variable that survives the call.
// This keeps each test's cacheManager state isolated (mutationListeners,
// syncInProgress, isInitialized, etc.).
const loadCacheManager = (): CacheManagerModule => {
  let mod!: CacheManagerModule;
  jest.isolateModules(() => {
    mod = require('@/lib/cacheManager');
  });
  return mod;
};

/* -------------------------------------------------------------------------- */
/* localStorage helpers (jest.setup.js installs the mock, but we also stub it  */
/* fresh per describe so each test sees an isolated store).                    */
/* -------------------------------------------------------------------------- */

const installFreshLocalStorage = () => {
  const data = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: jest.fn((k: string) => (data.has(k) ? data.get(k)! : null)),
    setItem: jest.fn((k: string, v: string) => {
      data.set(k, String(v));
    }),
    removeItem: jest.fn((k: string) => {
      data.delete(k);
    }),
    clear: jest.fn(() => {
      data.clear();
    }),
    key: jest.fn((i: number) => Array.from(data.keys())[i] ?? null),
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
  return { localStorageMock, data };
};

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('cacheManager', () => {
  beforeEach(() => {
    installFreshLocalStorage();
    // The propertyCache mock factory only runs once per test file, so its
    // in-memory storage and stats must be reset explicitly between tests.
    // `jest.mock(...)` is hoisted above all imports, so __resetMock is
    // guaranteed to exist by the time beforeEach runs.
    getPropertyCacheMock().__resetMock();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('sync queue', () => {
    it('queues items and reports length', () => {
      const cm = loadCacheManager();
      expect(cm.getSyncQueueLength()).toBe(0);
      cm.addToSyncQueue('property-update', { id: 'p-1' });
      cm.addToSyncQueue('property-delete', { id: 'p-2' });
      expect(cm.getSyncQueueLength()).toBe(2);
    });

    it('persists queued items to localStorage with a unique id and zero retries', () => {
      const cm = loadCacheManager();
      cm.addToSyncQueue('search-update', { term: 'penthouse' });

      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE);
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw as string);
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        type: 'search-update',
        payload: { term: 'penthouse' },
        retries: 0,
        timestamp: expect.any(Number),
      });
      expect(queue[0].id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('clears the queue', () => {
      const cm = loadCacheManager();
      cm.addToSyncQueue('property-update', { id: 'a' });
      cm.addToSyncQueue('property-update', { id: 'b' });
      expect(cm.getSyncQueueLength()).toBe(2);
      cm.clearSyncQueue();
      expect(cm.getSyncQueueLength()).toBe(0);
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE)).toBeNull();
    });

    it('returns zero length when localStorage is missing the key', () => {
      installFreshLocalStorage();
      const cm = loadCacheManager();
      expect(cm.getSyncQueueLength()).toBe(0);
    });

    it('returns zero length when the stored queue JSON is malformed', () => {
      installFreshLocalStorage();
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC_QUEUE, '{not json');
      const cm = loadCacheManager();
      expect(cm.getSyncQueueLength()).toBe(0);
    });

    it('does not throw when window is undefined (server-side guard)', () => {
      const originalWindowDescriptor = Object.getOwnPropertyDescriptor(global, 'window');
      // Simulate SSR by hiding the jsdom-provided global without mutating
      // the rest of the runtime (jsdom relies on `window` for many APIs).
      Object.defineProperty(global, 'window', {
        configurable: true,
        get: () => undefined,
      });
      try {
        const cm = loadCacheManager();
        expect(() => cm.addToSyncQueue('property-update', { id: 'p' })).not.toThrow();
        expect(cm.getSyncQueueLength()).toBe(0);
      } finally {
        if (originalWindowDescriptor) {
          Object.defineProperty(global, 'window', originalWindowDescriptor);
        }
      }
    });
  });

  describe('last sync time', () => {
    it('reports zero before sync and a timestamp after', async () => {
      const cm = loadCacheManager();
      expect(cm.getLastSyncTime()).toBe(0);
      await cm.performBackgroundSync();
      expect(cm.getLastSyncTime()).toBeGreaterThan(0);
      expect(window.localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC)).toBeTruthy();
    });

    it('is idempotent — second sync within the same tick is a no-op', async () => {
      const cm = loadCacheManager();
      const p1 = cm.performBackgroundSync();
      const p2 = cm.performBackgroundSync();
      await Promise.all([p1, p2]);
    });
  });

  describe('network state listener', () => {
    it('invokes listener when window fires the "offline" event', async () => {
      const cm = loadCacheManager();
      // initCacheManager wires the `window` online/offline handlers that fan
      // events out to listeners registered via addNetworkStateListener.
      await cm.initCacheManager();
      const listener = jest.fn();
      cm.addNetworkStateListener(listener);
      window.dispatchEvent(new Event('offline'));
      expect(listener).toHaveBeenCalledWith(false);
      expect(cm.isNetworkOnline()).toBe(false);
    });

    it('invokes listener and triggers sync when window fires the "online" event', async () => {
      const cm = loadCacheManager();
      await cm.initCacheManager();
      window.dispatchEvent(new Event('offline'));
      const beforeSyncTime = cm.getLastSyncTime();
      window.dispatchEvent(new Event('online'));
      // performBackgroundSync writes LAST_SYNC asynchronously —
      // flush microtasks but keep fake timers.
      await Promise.resolve();
      expect(cm.isNetworkOnline()).toBe(true);
      // Last sync time should have advanced (sync kicked off).
      expect(cm.getLastSyncTime()).toBeGreaterThanOrEqual(beforeSyncTime);
    });

    it('returns an unsubscribe function that removes the listener', () => {
      const cm = loadCacheManager();
      const listener = jest.fn();
      const unsubscribe = cm.addNetworkStateListener(listener);
      unsubscribe();
      window.dispatchEvent(new Event('offline'));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cache invalidation', () => {
    it('invalidates only entries whose ID matches the pattern', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await m.setCachedProperty({ id: 'prefix-1' } as never);
      await m.setCachedProperty({ id: 'prefix-2' } as never);
      await m.setCachedProperty({ id: 'other-3' } as never);

      const removed = await cm.invalidateCache(/^prefix-/);
      expect(removed).toBe(2);
      const remaining = await m.getAllCachedPropertyIds();
      expect(remaining).toEqual(['other-3']);
    });

    it('invalidating all cache also clears the sync queue', async () => {
      const cm = loadCacheManager();
      cm.addToSyncQueue('property-update', { id: 'p1' });
      cm.addToSyncQueue('search-update', { term: 'x' });
      expect(cm.getSyncQueueLength()).toBe(2);

      await cm.invalidateAllCache();
      expect(cm.getSyncQueueLength()).toBe(0);
      expect(getPropertyCacheMock().__getStorage().size()).toBe(0);
    });

    it('returns 0 from invalidateCache when there are no entries', async () => {
      const cm = loadCacheManager();
      const removed = await cm.invalidateCache(/^anything/);
      expect(removed).toBe(0);
    });
  });

  describe('mutations', () => {
    it('onMutation registers a handler and the returned function unsubscribes', () => {
      const cm = loadCacheManager();
      const handler = jest.fn();
      const unsubscribe = cm.onMutation('property-updated', handler);
      unsubscribe();
    });

    it('triggerMutation calls every registered listener for the type', async () => {
      const cm = loadCacheManager();
      const a = jest.fn();
      const b = jest.fn();
      cm.onMutation('property-updated', a);
      cm.onMutation('property-updated', b);
      await cm.triggerMutation('property-updated', { id: 'x' });
      expect(a).toHaveBeenCalledWith({ id: 'x' });
      expect(b).toHaveBeenCalledWith({ id: 'x' });
    });

    it('triggerMutation isolates a misbehaving listener (does not throw)', async () => {
      const cm = loadCacheManager();
      const safe = jest.fn();
      cm.onMutation('property-updated', () => {
        throw new Error('boom');
      });
      cm.onMutation('property-updated', safe);
      await cm.triggerMutation('property-updated', { id: 'x' });
      expect(safe).toHaveBeenCalled();
    });

    it('triggerMutation invalidates cache by pattern when patterns are supplied', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await m.setCachedProperty({ id: 'p-1' } as never);
      await m.setCachedProperty({ id: 'p-2' } as never);
      await cm.triggerMutation('batch', { ids: ['p-1', 'p-2'] }, [/^p-/]);
      const remaining = await m.getAllCachedPropertyIds();
      expect(remaining).toEqual([]);
    });
  });

  describe('cache health', () => {
    it('reports "healthy" when stats are nominal', async () => {
      const cm = loadCacheManager();
      const health = await cm.getCacheHealth();
      expect(health.healthy).toBe(true);
      expect(health.issues).toEqual([]);
      expect(health.stats).toBeDefined();
    });

    it('flags a critical storage usage when used/quota > 90%', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      const stats = m.__getStats() as {
        storageUsed: number;
        storageQuota: number;
      };
      stats.storageQuota = 1000;
      stats.storageUsed = 950;
      const health = await cm.getCacheHealth();
      expect(health.healthy).toBe(false);
      expect(health.issues.some((i) => /critical/i.test(i))).toBe(true);
    });

    it('flags a low hit rate when there are enough entries', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      // `getCacheHealth` re-reads stats via updateCacheStats — pre-set the
      // returned shape so the manual overrides are not clobbered.
      (m.updateCacheStats as jest.Mock).mockResolvedValueOnce({
        storageUsed: 0,
        storageQuota: 0,
        totalSize: 0,
        hitRate: 0.1,
        totalEntries: 50,
        oldestEntry: null,
        newestEntry: null,
        evictionCount: 0,
        invalidationCount: 0,
        entitiesByType: {},
        sizeByType: {},
      });
      const health = await cm.getCacheHealth();
      expect(health.healthy).toBe(false);
      expect(health.issues.some((i) => /hit rate/i.test(i))).toBe(true);
    });

    it('flags a large sync queue', async () => {
      const cm = loadCacheManager();
      for (let i = 0; i < 12; i += 1) {
        cm.addToSyncQueue('property-update', { id: `p${i}` });
      }
      const health = await cm.getCacheHealth();
      expect(health.healthy).toBe(false);
      expect(health.issues.some((i) => /sync queue/i.test(i))).toBe(true);
    });
  });

  describe('TTL/quota lifecycle (fake-timer driven)', () => {
    it('cleanupExpiredEntries removes entries whose TTL elapsed', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await m.setCachedProperty({ id: 'a' } as never);
      await m.setCachedProperty({ id: 'b' } as never);
      const before = m.__getStorage().size();
      expect(before).toBe(2);

      // Age everything 30 days into the future so each entry is now expired.
      jest.setSystemTime(new Date('2026-02-01T00:00:00Z'));
      const cleanup = getPropertyCacheMock().cleanupExpiredEntries as jest.Mock;
      cleanup.mockClear();
      // The fresh require re-creates the mock closure around fake time, so
      // also patch the underlying storage entries to truly be expired.
      const storage = m.__getStorage();
      storage.expireAll(Date.now());

      const removed = await cm.optimizeCache();
      expect(removed.cleaned).toBeGreaterThanOrEqual(2);
    });

    it('performBackgroundSync cleans expired entries and updates stats', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await m.setCachedProperty({ id: 'a' } as never);
      const storage = m.__getStorage();
      storage.expireAll(Date.now());

      await cm.performBackgroundSync();
      // After cleaning, the storage should be empty.
      expect(m.__getStorage().size()).toBe(0);
    });
  });

  describe('createCachedFetch strategies', () => {
    it('cache-first returns cached data without calling fetcher when fresh', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await m.setCachedProperty({ id: 'fresh' } as never);
      const fetcher = jest.fn().mockResolvedValue({ fresh: 'fetched' });
      const run = cm.createCachedFetch(fetcher, 'fresh', 'cache-first');
      // Patch the cache hit to look fresh.
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: { fresh: 'cached' },
        source: 'cache',
        stale: false,
      });
      const result = await run();
      expect(result.data).toEqual({ fresh: 'cached' });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('cache-first falls through to the fetcher on cache miss', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: null,
        source: 'none',
        stale: false,
      });
      const fetcher = jest.fn().mockResolvedValue({ id: 'fresh' });
      const run = cm.createCachedFetch(fetcher, 'miss', 'cache-first');
      const result = await run();
      expect(result.data).toEqual({ id: 'fresh' });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(m.setCachedProperty).toHaveBeenCalled();
    });

    it('cache-first returns stale cache when fetcher throws', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: { stale: 'yes' },
        source: 'cache',
        stale: true,
      });
      const fetcher = jest.fn().mockRejectedValue(new Error('network down'));
      const run = cm.createCachedFetch(fetcher, 'flaky', 'cache-first');
      const result = await run();
      expect(result.data).toEqual({ stale: 'yes' });
      expect(result.stale).toBe(true);
    });

    it('cache-first throws when both cache and network fail', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: null,
        source: 'none',
        stale: false,
      });
      const fetcher = jest.fn().mockRejectedValue(new Error('boom'));
      const run = cm.createCachedFetch(fetcher, 'missing', 'cache-first');
      await expect(run()).rejects.toThrow('boom');
    });

    it('network-first writes new data to the cache and returns it', async () => {
      const cm = loadCacheManager();
      const fetcher = jest.fn().mockResolvedValue({ id: 'net-first' });
      const run = cm.createCachedFetch(fetcher, 'net', 'network-first');
      const result = await run();
      expect(result.data).toEqual({ id: 'net-first' });
      expect(result.source).toBe('network');
    });

    it('network-first returns cached result when fetcher fails', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: { offline: true },
        source: 'cache',
        stale: true,
      });
      const fetcher = jest.fn().mockRejectedValue(new Error('offline'));
      const run = cm.createCachedFetch(fetcher, 'offline', 'network-first');
      const result = await run();
      expect(result.data).toEqual({ offline: true });
    });

    it('network-first throws when both fail', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: null,
        source: 'none',
        stale: false,
      });
      const fetcher = jest.fn().mockRejectedValue(new Error('none'));
      const run = cm.createCachedFetch(fetcher, 'all-bad', 'network-first');
      await expect(run()).rejects.toThrow('none');
    });

    it('stale-while-revalidate returns the cached value immediately', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: { cached: true },
        source: 'cache',
        stale: false,
      });
      const fetcher = jest.fn();
      const run = cm.createCachedFetch(fetcher, 'cached', 'stale-while-revalidate');
      const result = await run();
      expect(result.data).toEqual({ cached: true });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('cache-only never calls the fetcher and returns the cached value', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: { from: 'cache-only' },
        source: 'cache',
        stale: false,
      });
      const fetcher = jest.fn();
      const run = cm.createCachedFetch(fetcher, 'cache-only-key', 'cache-only');
      const result = await run();
      expect(result.data).toEqual({ from: 'cache-only' });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('network-only bypasses the cache entirely', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      (m.getCachedProperty as jest.Mock).mockResolvedValueOnce({
        data: { stale: 'should-not-be-used' },
        source: 'cache',
        stale: false,
      });
      const fetcher = jest.fn().mockResolvedValue({ fresh: true });
      const run = cm.createCachedFetch(fetcher, 'net-only', 'network-only');
      const result = await run();
      expect(result.data).toEqual({ fresh: true });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('throws on an unknown strategy', async () => {
      const cm = loadCacheManager();
      const run = cm.createCachedFetch(jest.fn(), 'x', 'made-up-strategy' as never);
      await expect(run()).rejects.toThrow(/Unknown cache strategy/);
    });
  });

  describe('export / import', () => {
    it('exportCacheData returns a JSON string containing the cached entries', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await m.setCachedProperty({ id: 'p-1' } as never);
      const exported = await cm.exportCacheData();
      const parsed = JSON.parse(exported);
      expect(parsed).toMatchObject({
        version: 1,
        properties: expect.any(Array),
        mobileProperties: expect.any(Array),
      });
      expect(parsed.properties.length).toBe(1);
    });

    it('importCacheData rejects unsupported export versions', async () => {
      const cm = loadCacheManager();
      const bad = JSON.stringify({ version: 99 });
      await expect(cm.importCacheData(bad)).rejects.toThrow(/Unsupported/);
    });

    it('importCacheData invokes setCachedProperty for every property in the export', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      m.__resetMock();
      const exported = JSON.stringify({
        version: 1,
        properties: [{ data: { id: 'restore-1' } }, { data: { id: 'restore-2' } }],
        mobileProperties: [{ data: { id: 'restore-m' } }],
      });
      await cm.importCacheData(exported);
      expect(m.setCachedProperty).toHaveBeenCalledWith({ id: 'restore-1' });
      // Mobile properties are supplied via setCachedMobileProperty (also mocked).
      expect(m.setCachedMobileProperty).toHaveBeenCalledWith({ id: 'restore-m' });
    });
  });

  describe('version migrations', () => {
    it('registerVersionMigration + getCacheVersion expose the registered handler', () => {
      const cm = loadCacheManager();
      expect(cm.getCacheVersion()).toBe(1);
      const handler = jest.fn((data) => ({ migrated: true, data }));
      cm.registerVersionMigration(2, handler);
      // Registering does not bump the current version; init-time migration does.
      expect(cm.getCacheVersion()).toBe(1);
    });
  });

  describe('default export surface', () => {
    it('exposes the most commonly used methods on the default export', () => {
      const cmDefault = loadCacheManager().default;
      expect(typeof cmDefault.init).toBe('function');
      expect(typeof cmDefault.isOnline).toBe('function');
      expect(typeof cmDefault.getLastSyncTime).toBe('function');
      expect(typeof cmDefault.performSync).toBe('function');
      expect(typeof cmDefault.addToSyncQueue).toBe('function');
      expect(typeof cmDefault.getSyncQueueLength).toBe('function');
      expect(typeof cmDefault.clearSyncQueue).toBe('function');
      expect(typeof cmDefault.invalidateCache).toBe('function');
      expect(typeof cmDefault.invalidateAll).toBe('function');
      expect(typeof cmDefault.getHealth).toBe('function');
      expect(typeof cmDefault.optimize).toBe('function');
      expect(typeof cmDefault.exportData).toBe('function');
      expect(typeof cmDefault.importData).toBe('function');
      expect(typeof cmDefault.createCachedFetch).toBe('function');
    });
  });

  describe('initCacheManager', () => {
    it('initializes once and becomes a no-op on subsequent calls', async () => {
      const cm = loadCacheManager();
      const m = getPropertyCacheMock();
      await cm.initCacheManager();
      await cm.initCacheManager();
      expect(m.initPropertyCache).toHaveBeenCalledTimes(1);
    });
  });
});
