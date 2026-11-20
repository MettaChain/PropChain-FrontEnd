import { useCallback, useEffect, useMemo, useState } from "react";

export type Holding = { chainId: number; asset: string; value: number; cost: number };
export type CompareItem = { id: string; price: number; yieldPct: number };
export type Channel = "email" | "push" | "inApp";
export type Category = "transactions" | "priceAlerts" | "governance";
export type NotificationPrefs = { enabled: boolean; channels: Record<Channel, boolean>; categories: Record<Category, boolean> };

/** Aggregate holdings across chains (#1398). */
export function aggregatePortfolio(holdings: Holding[]) {
  const total = holdings.reduce((s, h) => s + h.value, 0);
  const cost = holdings.reduce((s, h) => s + h.cost, 0);
  const byAsset: Record<string, number> = {};
  holdings.forEach((h) => (byAsset[h.asset] = (byAsset[h.asset] ?? 0) + h.value));
  const allocation = Object.fromEntries(Object.entries(byAsset).map(([a, v]) => [a, total ? (v / total) * 100 : 0]));
  return { total, pnl: total - cost, roi: cost ? ((total - cost) / cost) * 100 : 0, allocation };
}
export function useInvestmentPortfolio(load: () => Promise<Holding[]>) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const refresh = useCallback(() => load().then(setHoldings), [load]);
  useEffect(() => { refresh(); }, [refresh]);
  return { ...useMemo(() => aggregatePortfolio(holdings), [holdings]), refresh };
}

/** Comparison list capped at 5, with diffs against the first item (#1399). */
export const MAX_COMPARE = 5;
export const addToCompare = (list: CompareItem[], item: CompareItem) =>
  list.length >= MAX_COMPARE || list.some((p) => p.id === item.id) ? list : [...list, item];
export const compareMetrics = (list: CompareItem[]) =>
  list.map((p) => ({ id: p.id, priceDiff: p.price - (list[0]?.price ?? 0), yieldDiff: p.yieldPct - (list[0]?.yieldPct ?? 0) }));

/** Notification preferences with master switch (#1400). */
export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  channels: { email: true, push: false, inApp: true },
  categories: { transactions: true, priceAlerts: true, governance: false },
};
export const isNotificationOn = (p: NotificationPrefs, c: Channel, cat: Category) => p.enabled && p.channels[c] && p.categories[cat];

/** Gas tiers in ETH and USD (#1401). */
const GAS_UNITS: Record<string, number> = { transfer: 21000, approve: 46000, buy: 120000, stake: 90000 };
export function estimateGas(type: string, gasPriceGwei: number, ethUsd: number) {
  const units = GAS_UNITS[type] ?? 100000;
  const tier = (mult: number) => { const eth = (units * gasPriceGwei * mult) / 1e9; return { eth, usd: eth * ethUsd }; };
  return { units, slow: tier(0.8), standard: tier(1), fast: tier(1.25) };
}
export const useGasEstimator = (type: string, gwei: number, ethUsd: number) => useMemo(() => estimateGas(type, gwei, ethUsd), [type, gwei, ethUsd]);
