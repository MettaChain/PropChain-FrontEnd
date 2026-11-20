/** Transaction batching for multicall (#1422). */
export type Tx = { to: `0x${string}`; data: `0x${string}`; value?: bigint; chainId: number; gas?: number };
const BASE_TX_GAS = 21_000;
export function batchTransactions(txs: Tx[]) {
  const groups = new Map<number, Tx[]>();
  const separate: Tx[] = [];
  txs.forEach((t) => (t.value && t.value > 0n ? separate.push(t) : groups.set(t.chainId, [...(groups.get(t.chainId) ?? []), t])));
  const batches = [...groups.entries()].map(([chainId, calls]) => ({
    chainId, calls: calls.map((c) => ({ target: c.to, callData: c.data, allowFailure: false })),
    estimatedSavings: Math.max(0, calls.length - 1) * BASE_TX_GAS,
  }));
  return { batches, separate, totalSavings: batches.reduce((s, b) => s + b.estimatedSavings, 0) };
}

/** IPFS upload with retry and pinning (#1423). `post` wraps the IPFS HTTP API (e.g. /api/v0/add?pin=true). */
export type IpfsPost = (body: Blob, opts: { pin: boolean }) => Promise<{ cid: string }>;
export async function uploadToIpfs(post: IpfsPost, content: object | Blob, pin = true, retries = 3): Promise<string> {
  const body = content instanceof Blob ? content : new Blob([JSON.stringify(content)], { type: "application/json" });
  for (let i = 1; ; i++) {
    try { return (await post(body, { pin })).cid; } catch (e) { if (i >= retries) throw e; await new Promise((r) => setTimeout(r, 100 * i)); }
  }
}

/** Aggregate oracle + API prices with confidence (#1424). */
export type PriceSource = { source: string; price: number };
const priceCache = new Map<string, { at: number; value: ReturnType<typeof aggregatePrices> }>();
export function aggregatePrices(sources: PriceSource[]) {
  const unique = [...new Map(sources.filter((s) => s.price > 0).map((s) => [s.source, s])).values()];
  if (!unique.length) return { price: null as number | null, confidence: 0, sources: 0 };
  const sorted = unique.map((s) => s.price).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const spread = (sorted[sorted.length - 1] - sorted[0]) / median;
  return { price: median, confidence: Math.max(0, Math.min(1, (1 - spread) * Math.min(1, unique.length / 3))), sources: unique.length };
}
export async function getPropertyPrice(id: string, fetchers: (() => Promise<PriceSource>)[], ttlMs = 60_000) {
  const hit = priceCache.get(id);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const results = await Promise.allSettled(fetchers.map((f) => f()));
  const value = aggregatePrices(results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])));
  priceCache.set(id, { at: Date.now(), value });
  return value;
}

/** Bridge transaction status (#1425). */
export type BridgeRaw = { confirmations: number; required: number; failed?: boolean; secondsPerBlock: number };
export function bridgeStatus(raw: BridgeRaw) {
  if (raw.failed) return { state: "failed" as const, progress: 0, etaSeconds: null };
  const remaining = Math.max(0, raw.required - raw.confirmations);
  return { state: remaining ? ("pending" as const) : ("completed" as const), progress: Math.min(1, raw.confirmations / raw.required), etaSeconds: remaining * raw.secondsPerBlock };
}
