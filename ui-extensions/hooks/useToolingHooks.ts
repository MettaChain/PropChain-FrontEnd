import { useEffect, useState } from "react";

export type LookupResult = { input: string; address: string | null; name: string | null; error?: string };
export type Holding = { qty: number; avgPrice: number };
export type PaperState = { cash: number; holdings: Record<string, Holding>; history: { id: string; side: "buy" | "sell"; qty: number; price: number }[] };
export type Marker = { id: string; lat: number; lng: number };
export type Violation = { id: string; impact: "minor" | "moderate" | "serious" | "critical"; help: string; helpUrl?: string };

/** Debounced ENS <-> address lookup with cache (#1402). Resolver is injected (e.g. viem getEnsAddress/getEnsName). */
const lookupCache = new Map<string, LookupResult>();
export function useDebouncedAddressLookup(input: string, resolve: (v: string) => Promise<LookupResult>, delay = 300) {
  const [state, setState] = useState<{ loading: boolean; result: LookupResult | null }>({ loading: false, result: null });
  useEffect(() => {
    const v = input.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(v) && !v.endsWith(".eth")) return setState({ loading: false, result: null });
    if (lookupCache.has(v)) return setState({ loading: false, result: lookupCache.get(v)! });
    setState({ loading: true, result: null });
    const t = setTimeout(() => resolve(v).then((r) => { lookupCache.set(v, r); setState({ loading: false, result: r }); })
      .catch((e) => setState({ loading: false, result: { input: v, address: null, name: null, error: String(e) } })), delay);
    return () => clearTimeout(t);
  }, [input, delay]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** Paper trading reducer with virtual funds (#1403). */
export const initialPaper = (cash = 100_000): PaperState => ({ cash, holdings: {}, history: [] });
export function paperTrade(s: PaperState, id: string, side: "buy" | "sell", qty: number, price: number): PaperState {
  const h = s.holdings[id] ?? { qty: 0, avgPrice: 0 };
  if (side === "buy" ? qty * price > s.cash : qty > h.qty) throw new Error("insufficient " + (side === "buy" ? "funds" : "holdings"));
  const nextQty = h.qty + (side === "buy" ? qty : -qty);
  const avgPrice = side === "buy" ? (h.qty * h.avgPrice + qty * price) / nextQty : h.avgPrice;
  return { cash: s.cash + (side === "buy" ? -1 : 1) * qty * price, holdings: { ...s.holdings, [id]: { qty: nextQty, avgPrice } },
    history: [...s.history, { id, side, qty, price }] };
}
export const paperPnl = (s: PaperState, prices: Record<string, number>) =>
  Object.entries(s.holdings).reduce((sum, [id, h]) => sum + h.qty * ((prices[id] ?? h.avgPrice) - h.avgPrice), 0);

/** Bounds and grid clustering for map markers (#1404). */
export function markerBounds(m: Marker[]) {
  if (!m.length) return null;
  const lats = m.map((x) => x.lat), lngs = m.map((x) => x.lng);
  return { south: Math.min(...lats), west: Math.min(...lngs), north: Math.max(...lats), east: Math.max(...lngs) };
}
export function clusterMarkers(m: Marker[], zoom: number) {
  const cell = 360 / 2 ** zoom, groups: Record<string, Marker[]> = {};
  m.forEach((x) => (groups[`${Math.floor(x.lat / cell)}:${Math.floor(x.lng / cell)}`] ??= []).push(x));
  return Object.values(groups);
}

/** Summarise axe-core violations (#1405). Pass `(await axe.run(el, { runOnly: ["wcag21aa"] })).violations`. */
export const summarizeViolations = (v: Violation[]) => ({
  passed: v.length === 0, total: v.length,
  bySeverity: v.reduce<Record<string, number>>((acc, x) => ({ ...acc, [x.impact]: (acc[x.impact] ?? 0) + 1 }), {}),
  fixes: v.map((x) => ({ id: x.id, suggestion: x.help, url: x.helpUrl })),
});
