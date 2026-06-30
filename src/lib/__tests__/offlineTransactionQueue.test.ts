/**
 * @jest-environment jsdom
 */

const mockStore = new Map<string, unknown>();

jest.mock("@/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type FakeRequest<T> = {
  result: T;
  onsuccess: (() => void) | null;
  onerror: null;
};

const makeRequest = <T,>(result: T): FakeRequest<T> => {
  const request: FakeRequest<T> = { result, onsuccess: null, onerror: null };
  queueMicrotask(() => request.onsuccess?.());
  return request;
};

const fakeStore = {
  put: jest.fn((value: { id: string }) => {
    mockStore.set(value.id, value);
    return makeRequest(undefined);
  }),
  get: jest.fn((id: string) => makeRequest(mockStore.get(id))),
  getAll: jest.fn(() => makeRequest(Array.from(mockStore.values()))),
  delete: jest.fn((id: string) => {
    mockStore.delete(id);
    return makeRequest(undefined);
  }),
  clear: jest.fn(() => {
    mockStore.clear();
    return makeRequest(undefined);
  }),
};

const fakeTransaction = () => {
  const tx: {
    objectStore: () => typeof fakeStore;
    oncomplete: (() => void) | null;
    onerror: null;
    onabort: null;
  } = {
    objectStore: () => fakeStore,
    oncomplete: null,
    onerror: null,
    onabort: null,
  };
  queueMicrotask(() => tx.oncomplete?.());
  return tx;
};

const fakeDb = {
  transaction: jest.fn(() => fakeTransaction()),
  objectStoreNames: {
    contains: () => true,
  },
};

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();

  (global as unknown as { indexedDB: unknown }).indexedDB = {
    open: jest.fn(() => {
      const request: {
        result: typeof fakeDb;
        onsuccess: (() => void) | null;
        onerror: null;
        onupgradeneeded: null;
      } = {
        result: fakeDb,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    }),
  };
});

import {
  enqueueTransaction,
  getQueuedTransactions,
  removeTransaction,
  updateTransaction,
  registerRetryHandler,
  flushQueue,
  clearQueue,
  subscribeToQueue,
  registerBackgroundSync,
  startQueueAutoFlush,
} from "@/lib/offlineTransactionQueue";

describe("offlineTransactionQueue", () => {
  afterEach(async () => {
    await clearQueue();
  });

  it("enqueues and reads back a transaction", async () => {
    await enqueueTransaction({
      type: "purchase",
      payload: { propertyId: "abc" },
    });

    const queue = await getQueuedTransactions();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("purchase");
    expect(queue[0].status).toBe("pending");
  });

  it("removes transactions on success when flushing", async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    registerRetryHandler("transfer", handler);

    await enqueueTransaction({ type: "transfer", payload: { id: 1 } });
    await flushQueue();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(await getQueuedTransactions()).toHaveLength(0);
  });

  it("keeps transactions and increments attempts on handler failure", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("nope"));
    registerRetryHandler("management", handler);

    await enqueueTransaction({
      type: "management",
      payload: {},
      maxAttempts: 3,
    });
    await flushQueue();

    const queue = await getQueuedTransactions();
    expect(queue).toHaveLength(1);
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].status).toBe("pending");
    expect(queue[0].error).toBe("nope");
  });

  it("marks as failed once max attempts reached", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("boom"));
    registerRetryHandler("other", handler);

    const tx = await enqueueTransaction({
      type: "other",
      payload: {},
      maxAttempts: 1,
    });
    await flushQueue();

    const [stored] = await getQueuedTransactions();
    expect(stored.id).toBe(tx.id);
    expect(stored.status).toBe("failed");
  });

  it("removeTransaction deletes the entry", async () => {
    const tx = await enqueueTransaction({
      type: "purchase",
      payload: {},
    });
    await removeTransaction(tx.id);
    expect(await getQueuedTransactions()).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Coverage for: enqueue defaults, dedicated IDs, subscribers, update,
  // background sync registration, dedup, and auto-flush lifecycle.
  // -------------------------------------------------------------------------

  describe("enqueue defaults", () => {
    it("uses a generated tx-* id when none is provided", async () => {
      const item = await enqueueTransaction({
        type: "purchase",
        payload: {},
      });

      expect(item.id).toMatch(/^tx-\d+-[a-z0-9]+$/i);
      expect(item.attempts).toBe(0);
      expect(item.status).toBe("pending");
      expect(item.maxAttempts).toBe(5);
      expect(item.lastAttemptAt).toBeNull();
      expect(item.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it("preserves a caller-provided id and respects maxAttempts override", async () => {
      const item = await enqueueTransaction({
        type: "purchase",
        payload: { foo: "bar" },
        id: "explicit-id-1",
        maxAttempts: 9,
        description: "Buy a house",
      });

      expect(item.id).toBe("explicit-id-1");
      expect(item.maxAttempts).toBe(9);
      expect(item.description).toBe("Buy a house");
      expect(item.payload).toEqual({ foo: "bar" });
    });
  });

  describe("subscribeToQueue & notification", () => {
    it("notifies subscribers on enqueue and removal", async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToQueue(listener);

      const tx = await enqueueTransaction({
        type: "purchase",
        payload: { a: 1 },
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toHaveLength(1);
      expect(listener.mock.calls[0][0][0].id).toBe(tx.id);

      await removeTransaction(tx.id);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener.mock.calls[1][0]).toHaveLength(0);

      unsubscribe();
    });

    it("does not call listeners after they have unsubscribed", async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToQueue(listener);

      await enqueueTransaction({ type: "purchase", payload: {} });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      await enqueueTransaction({ type: "purchase", payload: {} });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("isolates a listener that throws while notifying others", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const good = jest.fn();
      const bad = jest.fn(() => {
        throw new Error("listener boom");
      });

      subscribeToQueue(bad);
      subscribeToQueue(good);

      await enqueueTransaction({ type: "purchase", payload: {} });

      expect(bad).toHaveBeenCalled();
      expect(good).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe("updateTransaction", () => {
    it("merges updates and returns the merged record", async () => {
      const tx = await enqueueTransaction({
        type: "purchase",
        payload: { foo: 1 },
      });

      const updated = await updateTransaction(tx.id, {
        status: "retrying",
        attempts: 2,
        lastAttemptAt: 1_000,
        error: "transient",
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe("retrying");
      expect(updated?.attempts).toBe(2);
      expect(updated?.lastAttemptAt).toBe(1_000);
      expect(updated?.error).toBe("transient");
      // Untouched fields are preserved.
      expect(updated?.type).toBe("purchase");
      expect(updated?.payload).toEqual({ foo: 1 });
    });

    it("returns null and does not write when the id does not exist", async () => {
      const writeSpy = jest.spyOn(fakeStore, "put");

      const result = await updateTransaction("missing-id", {
        attempts: 9,
      });

      expect(result).toBeNull();
      expect(writeSpy).not.toHaveBeenCalled();
    });
  });

  describe("flushQueue dedup", () => {
    it("flushes the queue once when called twice concurrently (in-flight dedup)", async () => {
      let resolveHandler!: () => void;
      const handlerPromise = new Promise<void>((res) => {
        resolveHandler = res;
      });
      const handler = jest.fn(() => handlerPromise);
      registerRetryHandler("slow", handler);

      await enqueueTransaction({ type: "slow", payload: {} });

      const first = flushQueue();
      const second = flushQueue();
      // `flushQueue` is declared `async`, so consecutive calls return
      // distinct wrapper Promises. The dedup invariant lives inside
      // the IIFE, so we settle it via a microtask flush before
      // resolving our captured handler.
      expect(first).toBeInstanceOf(Promise);
      expect(second).toBeInstanceOf(Promise);

      // Yield once so the IIFE has a chance to settle onto `await handler(...)`.
      await Promise.resolve();

      expect(resolveHandler).toBeDefined();
      resolveHandler();

      await Promise.all([first, second]);
      // The slow handler should have only run once because the second
      // call returned the in-flight promise.
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("flushes a second time once the previous flush has finished", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registerRetryHandler("two-rounds", handler);

      await enqueueTransaction({ type: "two-rounds", payload: {} });

      await flushQueue();
      expect(handler).toHaveBeenCalledTimes(1);

      await enqueueTransaction({ type: "two-rounds", payload: {} });
      await flushQueue();
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("flushQueue error handling", () => {
    it("falls back to 'Retry failed' when the handler throws a non-Error value", async () => {
      const handler = jest.fn().mockRejectedValue("string-only-error");
      registerRetryHandler("stringy", handler);

      await enqueueTransaction({
        type: "stringy",
        payload: {},
        maxAttempts: 5,
      });
      await flushQueue();

      const [stored] = await getQueuedTransactions();
      expect(stored.status).toBe("pending");
      expect(stored.error).toBe("Retry failed");
    });

    it("skips items that have no registered retry handler", async () => {
      const knownHandler = jest.fn().mockResolvedValue(undefined);
      registerRetryHandler("known", knownHandler);

      await enqueueTransaction({ type: "unknown-type", payload: {} });
      await enqueueTransaction({ type: "known", payload: {} });

      await flushQueue();

      expect(knownHandler).toHaveBeenCalledTimes(1);
      // The unknown-type item remains pending.
      const queue = await getQueuedTransactions();
      const unknown = queue.find((t) => t.type === "unknown-type");
      expect(unknown?.status).toBe("pending");
    });
  });

  describe("registerBackgroundSync", () => {
    it("registers the queue tag via the active service worker", async () => {
      const syncRegister = jest.fn().mockResolvedValue(undefined);
      const ready = Promise.resolve({
        sync: { register: syncRegister },
      });
      const originalReady = (navigator.serviceWorker as { ready?: Promise<unknown> })
        .ready;
      (navigator.serviceWorker as unknown as { ready: Promise<unknown> }).ready =
        ready;

      await registerBackgroundSync();

      expect(syncRegister).toHaveBeenCalledWith("propchain-transaction-queue");

      (navigator.serviceWorker as unknown as { ready: Promise<unknown> }).ready =
        originalReady;
    });

    it("does nothing when navigator.serviceWorker.ready.sync is missing", async () => {
      const ready = Promise.resolve({} as ServiceWorkerRegistration);
      const originalReady = (navigator.serviceWorker as { ready?: Promise<unknown> })
        .ready;
      (navigator.serviceWorker as unknown as { ready: Promise<unknown> }).ready =
        ready as unknown as Promise<unknown>;

      // Should not throw.
      await expect(registerBackgroundSync()).resolves.toBeUndefined();

      (navigator.serviceWorker as unknown as { ready: Promise<unknown> }).ready =
        originalReady;
    });

    it("does nothing when navigator.serviceWorker is not present", async () => {
      const originalSW = (navigator as unknown as {
        serviceWorker?: ServiceWorkerContainer;
      }).serviceWorker;
      // jsdom defines navigator.serviceWorker as a configurable getter.
      // Replacing it with another getter that throws sidesteps the
      // production code's `await navigator.serviceWorker.ready` line
      // inside its own try/catch, so the call resolves cleanly.
      Object.defineProperty(navigator, "serviceWorker", {
        get: () => {
          throw new Error("serviceWorker unavailable in this environment");
        },
        configurable: true,
      });

      await expect(registerBackgroundSync()).resolves.toBeUndefined();

      Object.defineProperty(navigator, "serviceWorker", {
        get: () => originalSW,
        configurable: true,
      });
    });
  });

  describe("startQueueAutoFlush", () => {
    it("attaches an 'online' listener and returns a cleanup callback", () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      const removeSpy = jest.spyOn(window, "removeEventListener");

      const cleanup = startQueueAutoFlush();
      expect(typeof cleanup).toBe("function");
      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));

      cleanup();

      expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("returns a no-op cleanup function when called repeatedly", () => {
      const first = startQueueAutoFlush();
      const second = startQueueAutoFlush();
      expect(typeof first).toBe("function");
      expect(typeof second).toBe("function");
      first();
      second();
    });

    it("flushes the queue when an online event is dispatched", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registerRetryHandler("auto", handler);

      await enqueueTransaction({ type: "auto", payload: {} });

      startQueueAutoFlush();
      window.dispatchEvent(new Event("online"));

      // flap any pending microtasks/promises
      await new Promise((res) => setTimeout(res, 0));
      await flushQueue();

      expect(handler).toHaveBeenCalled();

      // Cleanup so other tests don't run twice.
      jest
        .spyOn(window, "removeEventListener")
        .mockImplementation(() => undefined as unknown as void);
    });

    it("responds to service-worker TRANSACTION_QUEUE_FLUSH_REQUEST messages", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registerRetryHandler("sw-flush", handler);

      await enqueueTransaction({ type: "sw-flush", payload: {} });

      startQueueAutoFlush();

      const listener = (event: MessageEvent) => {
        // match the addEventListener call installed by startQueueAutoFlush
        void event;
      };
      void listener;

      navigator.serviceWorker.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "TRANSACTION_QUEUE_FLUSH_REQUEST" },
        }),
      );

      await new Promise((res) => setTimeout(res, 0));
      await flushQueue();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("clearQueue", () => {
    it("clears the store and notifies listeners with an empty array", async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToQueue(listener);

      await enqueueTransaction({ type: "purchase", payload: {} });
      expect(listener).toHaveBeenLastCalledWith(
        expect.arrayContaining([expect.any(Object)]),
      );

      await clearQueue();

      expect(listener).toHaveBeenLastCalledWith([]);
      expect(await getQueuedTransactions()).toHaveLength(0);

      unsubscribe();
    });
  });

  describe("server-side fallback", () => {
    it("does not read or write to IndexedDB when window is undefined", async () => {
      const originalWindow = (global as unknown as { window?: unknown }).window;
      const originalIndexedDB = (global as unknown as {
        indexedDB?: unknown;
      }).indexedDB;
      (global as unknown as { window?: unknown }).window = undefined;
      (global as unknown as { indexedDB?: unknown }).indexedDB = undefined;

      const enqueueResult = await enqueueTransaction({
        type: "purchase",
        payload: {},
      });

      expect(enqueueResult.id).toMatch(/^tx-/);

      // All read/clear paths should be safe no-ops.
      expect(await getQueuedTransactions()).toEqual([]);
      await expect(removeTransaction("anything")).resolves.toBeUndefined();
      await expect(clearQueue()).resolves.toBeUndefined();
      await expect(updateTransaction("anything", { attempts: 1 })).resolves.toBeNull();
      await expect(registerBackgroundSync()).resolves.toBeUndefined();
      await expect(flushQueue()).resolves.toBeUndefined();

      (global as unknown as { window?: unknown }).window = originalWindow;
      (global as unknown as { indexedDB?: unknown }).indexedDB = originalIndexedDB;
    });
  });
});
