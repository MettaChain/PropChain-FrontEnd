export type PropertyLike = { id: string; price?: number; location?: string; type?: string; amenities?: string[]; yieldPct?: number };
export type Weights = { price: number; location: number; type: number; amenities: number; yield: number };
export const DEFAULT_WEIGHTS: Weights = { price: 0.3, location: 0.25, type: 0.2, amenities: 0.15, yield: 0.1 };

const ratio = (a?: number, b?: number) => (a == null || b == null ? null : Math.min(a, b) / (Math.max(a, b) || 1));

export function similarity(a: PropertyLike, b: PropertyLike, w: Weights = DEFAULT_WEIGHTS): number {
  const shared = (a.amenities ?? []).filter((x) => b.amenities?.includes(x)).length;
  const union = new Set([...(a.amenities ?? []), ...(b.amenities ?? [])]).size;
  const parts: [number | null, number][] = [
    [ratio(a.price, b.price), w.price],
    [a.location && b.location ? Number(a.location === b.location) : null, w.location],
    [a.type && b.type ? Number(a.type === b.type) : null, w.type],
    [union ? shared / union : null, w.amenities],
    [ratio(a.yieldPct, b.yieldPct), w.yield],
  ];
  const used = parts.filter(([s]) => s != null) as [number, number][];
  const total = used.reduce((s, [, wt]) => s + wt, 0);
  return total ? used.reduce((s, [v, wt]) => s + v * wt, 0) / total : 0;
}
export const mostSimilar = (target: PropertyLike, list: PropertyLike[], w?: Weights) =>
  list.filter((p) => p.id !== target.id).map((p) => ({ ...p, score: similarity(target, p, w) })).sort((x, y) => y.score - x.score);

export function parseDateRange(input: string, now = new Date()): { start: Date | null; end: Date } {
  if (input === "all") return { start: null, end: now };
  const iso = input.split("..");
  if (iso.length === 2 && !isNaN(Date.parse(iso[0])) && !isNaN(Date.parse(iso[1]))) return { start: new Date(iso[0]), end: new Date(iso[1]) };
  const m = /^(\d+)([dwmy])$/.exec(input);
  if (!m) throw new Error(`invalid date range: ${input}`);
  const n = Number(m[1]), start = new Date(now);
  if (m[2] === "d" || m[2] === "w") start.setUTCDate(start.getUTCDate() - n * (m[2] === "w" ? 7 : 1));
  else start.setUTCMonth(start.getUTCMonth() - n * (m[2] === "y" ? 12 : 1));
  return { start, end: now };
}

export type Rates = Record<"USD" | "EUR" | "GBP" | "JPY" | "CNY" | "AED", number>;
let cached: { rates: Rates; at: number } | null = null;
export async function getRates(fetchRates: () => Promise<Rates>, ttlMs = 600_000): Promise<Rates> {
  if (cached && Date.now() - cached.at < ttlMs) return cached.rates;
  try { cached = { rates: await fetchRates(), at: Date.now() }; } catch (e) { if (!cached) throw e; }
  return cached.rates;
}
export async function convert(amounts: number[], from: keyof Rates, to: keyof Rates, fetchRates: () => Promise<Rates>) {
  const r = await getRates(fetchRates);
  return amounts.map((a) => (a / r[from]) * r[to]);
}

export function propertyRoi(cashInvested: number, cashFlows: number[], saleProceeds: number, years: number) {
  const income = cashFlows.reduce((s, c) => s + c, 0);
  const gain = saleProceeds + income - cashInvested;
  const roi = cashInvested ? (gain / cashInvested) * 100 : 0;
  const annualized = cashInvested && years > 0 ? (((saleProceeds + income) / cashInvested) ** (1 / years) - 1) * 100 : 0;
  const cashOnCash = cashInvested && years > 0 ? (income / years / cashInvested) * 100 : 0;
  return { roi, annualized, cashOnCash, breakdown: { income, appreciation: saleProceeds - cashInvested, gain } };
}
