import { createPriceFeed, createTracker, decryptDocument, encryptDocument, exportCsv } from "../lib/dataServices";

describe("data services", () => {
  it("encrypts and decrypts for authorised wallets only", async () => {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const doc = new TextEncoder().encode("deed").buffer;
    const enc = await encryptDocument(doc, key, ["0xAbC"], 2);
    expect(new TextDecoder().decode(await decryptDocument(enc, "0xabc", { 2: key }))).toBe("deed");
    await expect(decryptDocument(enc, "0xdef", { 2: key })).rejects.toThrow("access denied");
    await expect(decryptDocument(enc, "0xabc", { 1: key })).rejects.toThrow("missing key version 2");
  });

  it("tracks anonymised events in batches and honours opt-out", async () => {
    const send = jest.fn(async () => {});
    const t = createTracker(send, { batchSize: 2, optedOut: false });
    t.track({ type: "search", target: "a@b.com villas", at: 1, userId: "u1" });
    t.track({ type: "click", target: "buy", at: 2 });
    expect(send).toHaveBeenCalledWith([{ type: "search", target: "[email] villas", at: 1 }, { type: "click", target: "buy", at: 2 }]);
    t.optOut();
    t.track({ type: "click", target: "x", at: 3 });
    await t.flush();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("exports CSV with columns, filter and header", () => {
    const csv = exportCsv([{ id: 1, name: "A, B", price: 5 }, { id: 2, name: "C", price: 50 }],
      { columns: ["id", "name"], filter: (r) => r.price > 1 }, new Date("2026-01-01T00:00:00Z"));
    expect(csv.split("\n")).toEqual(["# Property listings | exported 2026-01-01T00:00:00.000Z | 2 rows", "id,name", '1,"A, B"', "2,C"]);
  });

  it("buffers and throttles WebSocket updates", () => {
    jest.useFakeTimers();
    let sock: { onmessage?: (m: { data: string }) => void; onclose?: () => void; close: () => void } = { close: () => {} };
    const Ws = jest.fn(() => (sock = { close: () => {} })) as unknown as typeof WebSocket;
    const feed = createPriceFeed("ws://x", Ws, 100);
    const cb = jest.fn();
    feed.subscribe(cb);
    sock.onmessage?.({ data: JSON.stringify({ propertyId: "p", price: 1, at: 1 }) });
    sock.onmessage?.({ data: JSON.stringify({ propertyId: "p", price: 2, at: 2 }) });
    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledWith([expect.objectContaining({ price: 1 }), expect.objectContaining({ price: 2 })]);
    sock.onclose?.();
    jest.advanceTimersByTime(1000);
    expect(Ws).toHaveBeenCalledTimes(2);
    feed.close();
    jest.useRealTimers();
  });
});
