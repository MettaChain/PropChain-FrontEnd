import { z } from "zod";

export const TAX_RATES: Record<string, number> = { "US-NY": 1.4, "US-TX": 1.8, "US-CA": 0.75, "US-FL": 0.9 };
export const EXEMPTIONS = { homestead: 25_000, senior: 15_000, veteran: 10_000 } as const;
export function estimatePropertyTax(assessed: number, location: string, exemptions: (keyof typeof EXEMPTIONS)[] = []) {
  const rate = TAX_RATES[location] ?? (() => { throw new Error(`unknown tax location: ${location}`); })();
  const taxable = Math.max(0, assessed - exemptions.reduce((s, e) => s + EXEMPTIONS[e], 0));
  const annual = (taxable * rate) / 100;
  return { annual, monthly: annual / 12, effectiveRate: assessed ? (annual / assessed) * 100 : 0 };
}

export type WalletState =
  | { status: "disconnected" } | { status: "connecting"; attempt: number } | { status: "connected"; address: string }
  | { status: "error"; error: string; attempt: number } | { status: "reconnecting"; attempt: number };
export type WalletEvent = { type: "CONNECT" } | { type: "SUCCESS"; address: string } | { type: "FAIL"; error: string } | { type: "DISCONNECT" } | { type: "RETRY" };
export function walletTransition(s: WalletState, e: WalletEvent, maxRetries = 3): WalletState {
  const attempt = "attempt" in s ? s.attempt : 0;
  if (e.type === "DISCONNECT") return { status: "disconnected" };
  if (e.type === "CONNECT" && s.status === "disconnected") return { status: "connecting", attempt: 1 };
  if (e.type === "SUCCESS" && (s.status === "connecting" || s.status === "reconnecting")) return { status: "connected", address: e.address };
  if (e.type === "FAIL" && (s.status === "connecting" || s.status === "reconnecting")) return { status: "error", error: e.error, attempt };
  if (e.type === "RETRY" && s.status === "error" && attempt < maxRetries) return { status: "reconnecting", attempt: attempt + 1 };
  throw new Error(`invalid transition ${s.status} -> ${e.type}`);
}
export function createWalletMachine(onChange: (s: WalletState) => void) {
  let state: WalletState = { status: "disconnected" };
  const send = (e: WalletEvent) => { state = walletTransition(state, e); onChange(state); return state; };
  return { send, get state() { return state; } };
}

export type Domain = { name: string; version: string; chainId: number; verifyingContract: `0x${string}` };
const builders = {
  permit: { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
  vote: { Vote: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "uint8" }] },
  transfer: { Transfer: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }, { name: "nonce", type: "uint256" }] },
};
export function buildTypedData(kind: keyof typeof builders, domain: Domain, message: Record<string, unknown>) {
  const types = builders[kind];
  const primaryType = Object.keys(types)[0] as string;
  const missing = (types as Record<string, { name: string }[]>)[primaryType].filter((f) => message[f.name] == null).map((f) => f.name);
  if (missing.length) throw new Error(`missing fields: ${missing.join(", ")}`);
  return { domain, types, primaryType, message };
}
export const signTyped = (signTypedData: (d: ReturnType<typeof buildTypedData>) => Promise<string>, ...a: Parameters<typeof buildTypedData>) =>
  signTypedData(buildTypedData(...a));

export const propertyMetadataSchema = z.object({
  name: z.string().min(1), type: z.enum(["residential", "commercial", "land"]), price: z.number().positive(),
  location: z.object({ city: z.string(), country: z.string() }), images: z.array(z.string()).optional(), zoning: z.string().optional(),
}).refine((m) => m.type !== "land" || !!m.zoning, { path: ["zoning"], message: "zoning is required for land" });
export function validatePropertyMetadata(data: unknown) {
  const r = propertyMetadataSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}
