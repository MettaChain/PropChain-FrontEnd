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
  registerRetryHandler,
  flushQueue,
  clearQueue,
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
});
