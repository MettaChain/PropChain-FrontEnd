import { decodeErrorResult, type Abi, type Hex } from "viem";

export type Currency = "USD" | "EUR" | "GBP" | "JPY";

/** Locale-aware price formatting with K/M/B abbreviation (#1406). */
export function formatPrice(value: number, currency: Currency = "USD", locale = "en-US", abbreviate = false): string {
  const digits = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency", currency, notation: abbreviate ? "compact" : "standard",
    minimumFractionDigits: abbreviate ? 0 : digits, maximumFractionDigits: abbreviate ? 1 : digits,
  }).format(Object.is(value, -0) ? 0 : value);
}

/** Truncate the middle of an address: 0x1234...5678 (#1407). */
export function formatAddress(address: string, prefix = 6, suffix = 4): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("invalid address");
  return address.length <= prefix + suffix ? address : `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

/** ENS resolution with TTL cache and batch support (#1408). Pass a viem public client. */
type EnsClient = { getEnsAddress(a: { name: string }): Promise<string | null>; getEnsName(a: { address: Hex }): Promise<string | null> };
const ensCache = new Map<string, { value: string | null; at: number }>();
export async function resolveEns(client: EnsClient, input?: string | null, ttlMs = 300_000): Promise<string | null> {
  if (!input) return null;
  const hit = ensCache.get(input);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = input.startsWith("0x")
    ? await client.getEnsName({ address: input as Hex }).catch(() => null)
    : await client.getEnsAddress({ name: input }).catch(() => null);
  ensCache.set(input, { value, at: Date.now() });
  return value;
}
export const resolveEnsBatch = (client: EnsClient, inputs: string[]) => Promise.all(inputs.map((i) => resolveEns(client, i)));

/** Decode revert data into a readable message (#1409). `getRevertData` fetches it for a tx hash. */
const revertCache = new Map<string, string>();
export async function decodeRevert(hash: string, getRevertData: (h: string) => Promise<Hex | null>, abi: Abi = []): Promise<string> {
  if (revertCache.has(hash)) return revertCache.get(hash)!;
  let msg = "Unknown error";
  try {
    const data = await getRevertData(hash);
    if (data) {
      const r = decodeErrorResult({ abi, data });
      msg = r.args?.length ? `${r.errorName}: ${r.args.join(", ")}` : r.errorName;
    }
  } catch { /* unknown selector */ }
  revertCache.set(hash, msg);
  return msg;
}
