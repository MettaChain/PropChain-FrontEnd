/**
 * Offline transaction queue
 *
 * Persists transactions that failed to send (or were initiated while offline)
 * in IndexedDB and retries them when connectivity is restored. The same store
 * is read by the service worker's background-sync handler so that retries can
 * be triggered even when the page is closed.
 */

import { logger } from "@/utils/logger";

export type QueuedTransactionStatus = "pending" | "retrying" | "failed";

export interface QueuedTransaction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
  lastAttemptAt: number | null;
  attempts: number;
  maxAttempts: number;
  status: QueuedTransactionStatus;
  error?: string;
  description?: string;
}

export type QueueChangeListener = (queue: QueuedTransaction[]) => void;

const DB_NAME = "propchain-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "transactions";
const SYNC_TAG = "propchain-transaction-queue";

const listeners = new Set<QueueChangeListener>();

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  return operation(store);
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function notify(queue: QueuedTransaction[]) {
  listeners.forEach((listener) => {
    try {
      listener(queue);
    } catch (error) {
      logger.warn("Offline queue listener threw", error);
    }
  });
}

export const subscribeToQueue = (listener: QueueChangeListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getQueuedTransactions = async (): Promise<QueuedTransaction[]> => {
  if (!isBrowser()) return [];
  try {
    return await withStore("readonly", async (store) => {
      const result = await requestToPromise(store.getAll());
      return (result as QueuedTransaction[]) || [];
    });
  } catch (error) {
    logger.warn("Failed to read offline transaction queue", error);
    return [];
  }
};

export const enqueueTransaction = async (
  input: Omit<
    QueuedTransaction,
    "id" | "createdAt" | "lastAttemptAt" | "attempts" | "status" | "maxAttempts"
  > & { id?: string; maxAttempts?: number }
): Promise<QueuedTransaction> => {
  const item: QueuedTransaction = {
    id: input.id ?? `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    payload: input.payload,
    description: input.description,
    createdAt: Date.now(),
    lastAttemptAt: null,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 5,
    status: "pending",
  };

  if (!isBrowser()) return item;

  await withStore("readwrite", async (store) => {
    await requestToPromise(store.put(item));
  });

  await registerBackgroundSync();
  const queue = await getQueuedTransactions();
  notify(queue);
  return item;
};

export const removeTransaction = async (id: string): Promise<void> => {
  if (!isBrowser()) return;
  await withStore("readwrite", async (store) => {
    await requestToPromise(store.delete(id));
  });
  notify(await getQueuedTransactions());
};

export const updateTransaction = async (
  id: string,
  updates: Partial<QueuedTransaction>
): Promise<QueuedTransaction | null> => {
  if (!isBrowser()) return null;
  const updated = await withStore<QueuedTransaction | null>(
    "readwrite",
    async (store) => {
      const existing = (await requestToPromise(store.get(id))) as
        | QueuedTransaction
        | undefined;
      if (!existing) return null;
      const merged: QueuedTransaction = { ...existing, ...updates };
      await requestToPromise(store.put(merged));
      return merged;
    }
  );
  notify(await getQueuedTransactions());
  return updated;
};

export const clearQueue = async (): Promise<void> => {
  if (!isBrowser()) return;
  await withStore("readwrite", async (store) => {
    await requestToPromise(store.clear());
  });
  notify([]);
};

export const registerBackgroundSync = async (): Promise<void> => {
  if (!isBrowser()) return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sync = (registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    }).sync;
    if (sync && typeof sync.register === "function") {
      await sync.register(SYNC_TAG);
    }
  } catch (error) {
    logger.debug("Background sync registration failed", error);
  }
};

export type RetryHandler = (
  transaction: QueuedTransaction
) => Promise<unknown>;

const handlers = new Map<string, RetryHandler>();

export const registerRetryHandler = (
  type: string,
  handler: RetryHandler
): (() => void) => {
  handlers.set(type, handler);
  return () => {
    if (handlers.get(type) === handler) handlers.delete(type);
  };
};

let flushInFlight: Promise<void> | null = null;

export const flushQueue = async (): Promise<void> => {
  if (!isBrowser()) return;
  if (flushInFlight) return flushInFlight;

  flushInFlight = (async () => {
    const queue = await getQueuedTransactions();
    for (const item of queue) {
      const handler = handlers.get(item.type);
      if (!handler) continue;
      const next: QueuedTransaction = {
        ...item,
        status: "retrying",
        attempts: item.attempts + 1,
        lastAttemptAt: Date.now(),
      };
      await updateTransaction(item.id, next);
      try {
        await handler(next);
        await removeTransaction(item.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Retry failed";
        const exhausted = next.attempts >= next.maxAttempts;
        await updateTransaction(item.id, {
          status: exhausted ? "failed" : "pending",
          error: message,
        });
      }
    }
  })().finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
};

let connectivityListenerAttached = false;

export const startQueueAutoFlush = (): (() => void) => {
  if (!isBrowser()) return () => {};
  if (connectivityListenerAttached) return () => {};
  connectivityListenerAttached = true;

  const onOnline = () => {
    flushQueue().catch((error) =>
      logger.warn("Failed to flush offline queue on reconnect", error)
    );
  };

  window.addEventListener("online", onOnline);
  if (navigator.onLine) {
    flushQueue().catch(() => {});
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const data = (event.data || {}) as { type?: string };
      if (data.type === "TRANSACTION_QUEUE_FLUSH_REQUEST") {
        onOnline();
      }
    });
  }

  return () => {
    window.removeEventListener("online", onOnline);
    connectivityListenerAttached = false;
  };
};
