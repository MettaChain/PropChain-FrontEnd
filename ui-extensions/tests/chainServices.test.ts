import { aggregatePrices, batchTransactions, bridgeStatus, getPropertyPrice, uploadToIpfs } from "../lib/chainServices";

const to = "0x0000000000000000000000000000000000000001" as const;

describe("chain services", () => {
  it("batches compatible transactions and keeps value txs separate", () => {
    const r = batchTransactions([
      { to, data: "0x01", chainId: 1 }, { to, data: "0x02", chainId: 1 },
      { to, data: "0x03", chainId: 137 }, { to, data: "0x04", chainId: 1, value: 1n },
    ]);
    expect(r.batches).toHaveLength(2);
    expect(r.separate).toHaveLength(1);
    expect(r.totalSavings).toBe(21_000);
  });

  it("uploads to IPFS with retry", async () => {
    const post = jest.fn().mockRejectedValueOnce(new Error("busy")).mockResolvedValue({ cid: "bafy123" });
    expect(await uploadToIpfs(post, { name: "Prop" })).toBe("bafy123");
    expect(post).toHaveBeenCalledTimes(2);
    await expect(uploadToIpfs(jest.fn().mockRejectedValue(new Error("down")), { a: 1 }, true, 1)).rejects.toThrow("down");
  });

  it("aggregates prices with confidence and caches", async () => {
    expect(aggregatePrices([{ source: "oracle", price: 100 }, { source: "api", price: 100 }, { source: "api", price: 100 }])).toEqual({ price: 100, confidence: 2 / 3, sources: 2 });
    const f = jest.fn(async () => ({ source: "oracle", price: 50 }));
    await getPropertyPrice("p1", [f, async () => { throw new Error("x"); }]);
    await getPropertyPrice("p1", [f]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("reports bridge status", () => {
    expect(bridgeStatus({ confirmations: 6, required: 12, secondsPerBlock: 12 })).toEqual({ state: "pending", progress: 0.5, etaSeconds: 72 });
    expect(bridgeStatus({ confirmations: 12, required: 12, secondsPerBlock: 12 }).state).toBe("completed");
    expect(bridgeStatus({ confirmations: 1, required: 12, failed: true, secondsPerBlock: 12 }).state).toBe("failed");
  });
});
