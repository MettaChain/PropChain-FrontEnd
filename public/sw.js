/* PropChain service worker */
/* eslint-disable no-restricted-globals */

const SW_VERSION = "v2";
const STATIC_CACHE = `propchain-static-${SW_VERSION}`;
const RUNTIME_CACHE = `propchain-runtime-${SW_VERSION}`;
const PROPERTIES_CACHE = `propchain-properties-${SW_VERSION}`;
const IMAGE_CACHE = `propchain-images-${SW_VERSION}`;

const KNOWN_CACHES = new Set([
  STATIC_CACHE,
  RUNTIME_CACHE,
  PROPERTIES_CACHE,
  IMAGE_CACHE,
]);

const STATIC_ASSETS = ["/", "/offline.html", "/favicon.ico"];

// Cache invalidation strategy: each cache has a max age and a max entry count.
// Entries older than maxAge are dropped on read; entries beyond maxEntries are
// trimmed (oldest first) on write.
const CACHE_LIMITS = {
  [STATIC_CACHE]: { maxAge: 30 * 24 * 60 * 60 * 1000, maxEntries: 200 },
  [RUNTIME_CACHE]: { maxAge: 7 * 24 * 60 * 60 * 1000, maxEntries: 100 },
  [PROPERTIES_CACHE]: { maxAge: 24 * 60 * 60 * 1000, maxEntries: 150 },
  [IMAGE_CACHE]: { maxAge: 30 * 24 * 60 * 60 * 1000, maxEntries: 250 },
};

const TRANSACTION_QUEUE_TAG = "propchain-transaction-queue";
const TRANSACTION_QUEUE_DB = "propchain-offline-queue";
const TRANSACTION_QUEUE_STORE = "transactions";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_CACHES.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isPropertyRequest(url) {
  return (
    url.pathname.startsWith("/properties") ||
    url.pathname.startsWith("/mobile-properties") ||
    url.pathname.startsWith("/api/properties")
  );
}

function isImageRequest(request, url) {
  if (request.destination === "image") return true;
  return /\.(?:png|jpg|jpeg|webp|avif|svg|gif|ico)$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    /\.(?:css|js|woff2?|ttf|otf|eot)$/i.test(url.pathname)
  );
}

function withTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set("x-sw-cached-at", String(Date.now()));
  return response
    .blob()
    .then((body) => new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }));
}

async function isExpired(response, maxAge) {
  if (!response) return true;
  const cachedAt = Number(response.headers.get("x-sw-cached-at") || 0);
  if (!cachedAt) return false;
  return Date.now() - cachedAt > maxAge;
}

async function trimCache(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  if (!limit) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit.maxEntries) return;
  const excess = keys.length - limit.maxEntries;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}

async function cachePut(cacheName, request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(cacheName);
  const stamped = await withTimestamp(response);
  await cache.put(request, stamped);
  trimCache(cacheName).catch(() => {});
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const limit = CACHE_LIMITS[cacheName];
  const expired = cached && limit ? await isExpired(cached, limit.maxAge) : false;

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const clone = response.clone();
        cachePut(cacheName, request, clone).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached && !expired) {
    networkPromise.catch(() => {});
    return cached;
  }
  const network = await networkPromise;
  return network || cached || Response.error();
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const clone = response.clone();
      cachePut(cacheName, request, clone).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const limit = CACHE_LIMITS[cacheName];
  if (cached && (!limit || !(await isExpired(cached, limit.maxAge)))) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const clone = response.clone();
      cachePut(cacheName, request, clone).catch(() => {});
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cachePut(RUNTIME_CACHE, request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (!isSameOrigin) {
    if (isImageRequest(request, url)) {
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
    }
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (isPropertyRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, PROPERTIES_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// --- Cache invalidation messages ---------------------------------------------
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "CLEAR_CACHE") {
    const target = data.cache;
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => (target ? key === target : KNOWN_CACHES.has(key)))
            .map((key) => caches.delete(key))
        )
      )
    );
    return;
  }
  if (data.type === "INVALIDATE_PROPERTIES") {
    event.waitUntil(caches.delete(PROPERTIES_CACHE));
    return;
  }
  if (data.type === "FLUSH_TRANSACTION_QUEUE") {
    event.waitUntil(flushTransactionQueue());
  }
});

// --- Background sync for queued transactions --------------------------------
self.addEventListener("sync", (event) => {
  if (event.tag === TRANSACTION_QUEUE_TAG) {
    event.waitUntil(flushTransactionQueue());
  }
});

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TRANSACTION_QUEUE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TRANSACTION_QUEUE_STORE)) {
        db.createObjectStore(TRANSACTION_QUEUE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readQueuedTransactions() {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSACTION_QUEUE_STORE, "readonly");
    const store = tx.objectStore(TRANSACTION_QUEUE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function flushTransactionQueue() {
  let queued;
  try {
    queued = await readQueuedTransactions();
  } catch {
    return;
  }
  if (!queued.length) return;
  await notifyClients({ type: "TRANSACTION_QUEUE_FLUSH_REQUEST" });
}
