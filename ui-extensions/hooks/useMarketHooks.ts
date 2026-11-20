import { useCallback, useEffect, useMemo, useState } from "react";

export type ValuationPoint = { date: string; value: number };
export type Trend = { direction: "up" | "down" | "stable"; changePct: number };
export type Proposal = { id: string; status: "active" | "passed" | "failed"; createdAt: number; endsAt: number; votes: number };
export type PriceAlert = { id: string; propertyId: string; threshold: number };

/** Trend over a valuation series (#1394). Within +/-1% counts as stable. */
export function computeTrend(points: ValuationPoint[]): Trend {
  if (points.length < 2 || points[0].value === 0) return { direction: "stable", changePct: 0 };
  const changePct = ((points[points.length - 1].value - points[0].value) / points[0].value) * 100;
  return { direction: changePct > 1 ? "up" : changePct < -1 ? "down" : "stable", changePct };
}

const valuationCache = new Map<string, ValuationPoint[]>();
export function usePropertyValuation(id: string, range: string, fetcher: (id: string, range: string) => Promise<ValuationPoint[]>) {
  const key = `${id}:${range}`;
  const [data, setData] = useState(valuationCache.get(key) ?? null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (valuationCache.has(key)) return;
    fetcher(id, range).then((d) => { valuationCache.set(key, d); setData(d); }).catch(setError);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, loading: !data && !error, trend: data ? computeTrend(data) : null };
}

/** Compounded staking projection (#1395). Pure. */
export function projectStaking(stake: number, apy: number, days: number, freq: "daily" | "weekly" | "monthly") {
  const periods = { daily: 365, weekly: 52, monthly: 12 }[freq];
  const steps = Math.max(0, Math.floor((Math.min(days, 3650) / 365) * periods));
  const rate = apy / 100 / periods;
  const schedule = Array.from({ length: steps }, (_, i) => ({ period: i + 1, amount: stake * (1 + rate) ** (i + 1) }));
  return { schedule, total: stake * (1 + rate) ** steps, effectiveApy: ((1 + rate) ** periods - 1) * 100 };
}
export const useStakingRewards = (...a: Parameters<typeof projectStaking>) => useMemo(() => projectStaking(...a), a); // eslint-disable-line react-hooks/exhaustive-deps

/** Filter, sort and paginate proposals (#1396). */
export function selectProposals(list: Proposal[], status: Proposal["status"] | "all", sort: "date" | "votes" | "ending", page = 1, size = 10) {
  const key = { date: (p: Proposal) => -p.createdAt, votes: (p: Proposal) => -p.votes, ending: (p: Proposal) => p.endsAt }[sort];
  const filtered = list.filter((p) => status === "all" || p.status === status).sort((a, b) => key(a) - key(b));
  return filtered.slice((page - 1) * size, page * size);
}

/** Price alerts persisted to localStorage (#1397). */
export const triggeredAlerts = (alerts: PriceAlert[], prices: Record<string, number>) =>
  alerts.filter((a) => (prices[a.propertyId] ?? 0) >= a.threshold);
export function usePriceAlerts(storageKey = "propchain.priceAlerts") {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => (typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem(storageKey) ?? "[]")));
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(alerts)), [alerts, storageKey]);
  const add = useCallback((propertyId: string, threshold: number) => setAlerts((a) => [...a, { id: `${Date.now()}`, propertyId, threshold }]), []);
  const remove = useCallback((id: string) => setAlerts((a) => a.filter((x) => x.id !== id)), []);
  return { alerts, add, remove };
}
