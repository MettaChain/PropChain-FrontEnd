'use client';

import React, { useEffect, useMemo, useState } from 'react';

type GasTier = 'slow' | 'standard' | 'fast';
type GasUnit = 'Gwei' | 'USD';

export type GasChainId = 1 | 56 | 137 | 42161;

interface GasChain {
  id: GasChainId;
  name: string;
  nativeToken: string;
  nativeTokenUsd: number;
  rpcUrl: string;
}

interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
}

interface GasHistoryPoint {
  timestamp: number;
  gwei: number;
}

export interface GasPriceTrackerProps {
  rpcUrls?: Partial<Record<GasChainId, string>>;
  nativeTokenPricesUsd?: Partial<Record<GasChainId, number>>;
  initialAlertThreshold?: number;
  initialChainId?: GasChainId;
}

const CHAINS: GasChain[] = [
  {
    id: 1,
    name: 'Ethereum',
    nativeToken: 'ETH',
    nativeTokenUsd: 3000,
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
  },
  {
    id: 137,
    name: 'Polygon',
    nativeToken: 'POL',
    nativeTokenUsd: 0.85,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
  },
  {
    id: 56,
    name: 'BNB Chain',
    nativeToken: 'BNB',
    nativeTokenUsd: 600,
    rpcUrl: 'https://bsc-rpc.publicnode.com',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    nativeToken: 'ETH',
    nativeTokenUsd: 3000,
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
  },
];

const POLL_INTERVAL_MS = 30_000;
const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
const TRANSFER_GAS_LIMIT = 21_000;
const HISTORY_STORAGE_PREFIX = 'propchain-gas-tracker-history';
const TIERS: GasTier[] = ['slow', 'standard', 'fast'];
const FEE_PERCENTILES = [10, 50, 90];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseHex = (value: unknown): bigint => {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error('RPC returned an invalid gas price.');
  }
  return BigInt(value);
};

const toGwei = (wei: bigint): number => Number(wei) / 1e9;

const rpcRequest = async (
  rpcUrl: string,
  method: string,
  params: unknown[],
  signal: AbortSignal,
): Promise<unknown> => {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error('RPC returned an invalid response.');
  }
  if (isRecord(payload.error)) {
    throw new Error(
      typeof payload.error.message === 'string'
        ? payload.error.message
        : 'RPC returned an error.',
    );
  }
  if (!('result' in payload)) {
    throw new Error('RPC response did not include a result.');
  }
  return payload.result;
};

const readFeeHistory = (result: unknown): GasPrices => {
  if (
    !isRecord(result) ||
    !Array.isArray(result.baseFeePerGas) ||
    !Array.isArray(result.reward) ||
    !Array.isArray(result.reward[0]) ||
    result.reward[0].length < 3
  ) {
    throw new Error('RPC returned incomplete fee history.');
  }

  const baseFee = parseHex(result.baseFeePerGas[0]);
  const tiers = result.reward[0].slice(0, 3).map((reward) => baseFee + parseHex(reward));
  return {
    slow: toGwei(tiers[0]),
    standard: toGwei(tiers[1]),
    fast: toGwei(tiers[2]),
  };
};

const fetchGasPrices = async (rpcUrl: string, signal: AbortSignal): Promise<GasPrices> => {
  try {
    const feeHistory = await rpcRequest(
      rpcUrl,
      'eth_feeHistory',
      ['0x1', 'latest', FEE_PERCENTILES],
      signal,
    );
    return readFeeHistory(feeHistory);
  } catch (feeHistoryError) {
    if (signal.aborted) throw feeHistoryError;

    try {
      const gasPrice = toGwei(
        parseHex(await rpcRequest(rpcUrl, 'eth_gasPrice', [], signal)),
      );
      return {
        slow: gasPrice * 0.9,
        standard: gasPrice,
        fast: gasPrice * 1.25,
      };
    } catch (gasPriceError) {
      if (signal.aborted) throw gasPriceError;
      const reason =
        gasPriceError instanceof Error ? gasPriceError.message : 'Unknown RPC error.';
      throw new Error(`Unable to load gas prices: ${reason}`);
    }
  }
};

const readStoredHistory = (chainId: GasChainId): GasHistoryPoint[] => {
  try {
    const stored = window.localStorage.getItem(`${HISTORY_STORAGE_PREFIX}-${chainId}`);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Stored gas history is not a list.');
    }

    const cutoff = Date.now() - HISTORY_WINDOW_MS;
    return parsed.filter(
      (point): point is GasHistoryPoint =>
        isRecord(point) &&
        typeof point.timestamp === 'number' &&
        Number.isFinite(point.timestamp) &&
        point.timestamp >= cutoff &&
        point.timestamp <= Date.now() &&
        typeof point.gwei === 'number' &&
        Number.isFinite(point.gwei) &&
        point.gwei >= 0,
    );
  } catch (error) {
    console.warn('Unable to read saved gas price history.', error);
    return [];
  }
};

const formatTimestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function GasTrendChart({ points }: { points: GasHistoryPoint[] }) {
  const path = useMemo(() => {
    if (points.length === 0) return '';
    const values = points.map((point) => point.gwei);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const cutoff = Date.now() - HISTORY_WINDOW_MS;
    return points
      .map((point, index) => {
        const x = Math.max(
          0,
          Math.min(240, ((point.timestamp - cutoff) / HISTORY_WINDOW_MS) * 240),
        );
        const y = 56 - ((point.gwei - min) / range) * 48;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <div>
      <svg
        className="h-16 w-full overflow-visible text-blue-600 dark:text-blue-400"
        viewBox="0 0 240 64"
        role="img"
        aria-label="Standard gas price trend over the last 24 hours"
        preserveAspectRatio="none"
      >
        <path d="M 0 60 H 240" fill="none" stroke="currentColor" strokeOpacity="0.15" />
        {path ? (
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <path
            d="M 0 32 H 240"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />
        )}
      </svg>
      <div className="flex justify-between text-xs text-gray-500">
        <span>24h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export function GasPriceTracker({
  rpcUrls = {},
  nativeTokenPricesUsd = {},
  initialAlertThreshold = 100,
  initialChainId = 1,
}: GasPriceTrackerProps) {
  const [chainId, setChainId] = useState<GasChainId>(initialChainId);
  useEffect(() => setChainId(initialChainId), [initialChainId]);
  const [unit, setUnit] = useState<GasUnit>('Gwei');
  const [alertThreshold, setAlertThreshold] = useState(
    Number.isFinite(initialAlertThreshold) && initialAlertThreshold >= 0
      ? initialAlertThreshold
      : 100,
  );
  const [pricesByChain, setPricesByChain] = useState<
    Partial<Record<GasChainId, GasPrices>>
  >({});
  const [historyByChain, setHistoryByChain] = useState<
    Partial<Record<GasChainId, GasHistoryPoint[]>>
  >({});
  const [updatedAtByChain, setUpdatedAtByChain] = useState<
    Partial<Record<GasChainId, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chain = CHAINS.find((item) => item.id === chainId) ?? CHAINS[0];
  const rpcUrl = rpcUrls[chain.id] ?? chain.rpcUrl;
  const prices = pricesByChain[chain.id];
  const history = historyByChain[chain.id] ?? [];
  const updatedAt = updatedAtByChain[chain.id];
  const configuredTokenPrice = nativeTokenPricesUsd[chain.id];
  const tokenPrice =
    configuredTokenPrice !== undefined &&
    Number.isFinite(configuredTokenPrice) &&
    configuredTokenPrice > 0
      ? configuredTokenPrice
      : chain.nativeTokenUsd;
  const recentHistory = history.filter(
    (point) => point.timestamp >= Date.now() - HISTORY_WINDOW_MS,
  );

  useEffect(() => {
    setHistoryByChain((current) =>
      current[chain.id] === undefined
        ? { ...current, [chain.id]: readStoredHistory(chain.id) }
        : current,
    );
  }, [chain.id]);

  useEffect(() => {
    Object.entries(historyByChain).forEach(([id, points]) => {
      if (!points) return;
      try {
        window.localStorage.setItem(
          `${HISTORY_STORAGE_PREFIX}-${id}`,
          JSON.stringify(points),
        );
      } catch (storageError) {
        console.warn('Unable to save gas price history.', storageError);
      }
    });
  }, [historyByChain]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let inFlight = false;

    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const nextPrices = await fetchGasPrices(rpcUrl, controller.signal);
        if (!active) return;

        const timestamp = Date.now();
        setPricesByChain((current) => ({ ...current, [chain.id]: nextPrices }));
        setUpdatedAtByChain((current) => ({ ...current, [chain.id]: timestamp }));
        setHistoryByChain((current) => {
          const cutoff = timestamp - HISTORY_WINDOW_MS;
          const existing = (current[chain.id] ?? readStoredHistory(chain.id)).filter(
            (point) => point.timestamp >= cutoff,
          );
          const lastPoint = existing[existing.length - 1];
          const points =
            lastPoint && timestamp - lastPoint.timestamp < POLL_INTERVAL_MS
              ? [...existing.slice(0, -1), { timestamp, gwei: nextPrices.standard }]
              : [...existing, { timestamp, gwei: nextPrices.standard }];
          return { ...current, [chain.id]: points };
        });
        setError(null);
      } catch (fetchError) {
        if (!active || controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to load gas prices due to an unknown error.',
        );
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [chain.id, rpcUrl]);

  const formatPrice = (gwei: number): string =>
    unit === 'Gwei'
      ? `${gwei.toFixed(2)} Gwei`
      : `$${((gwei / 1e9) * tokenPrice * TRANSFER_GAS_LIMIT).toFixed(4)}`;

  const standardPrice = prices?.standard;

  return (
    <section
      className="w-full max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      aria-label="Gas price tracker"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Gas Price Tracker</h2>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="gas-tracker-chain">
            Select chain
          </label>
          <select
            id="gas-tracker-chain"
            className="rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-600"
            value={chain.id}
            onChange={(event) => {
              const nextChain = CHAINS.find(
                (item) => item.id === Number(event.target.value),
              );
              if (!nextChain) return;
              setChainId(nextChain.id);
              setLoading(true);
              setError(null);
            }}
          >
            {CHAINS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="gas-tracker-unit">
            Display unit
          </label>
          <select
            id="gas-tracker-unit"
            className="rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-600"
            value={unit}
            onChange={(event) => {
              if (event.target.value === 'Gwei' || event.target.value === 'USD') {
                setUnit(event.target.value);
              }
            }}
          >
            <option value="Gwei">Gwei</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {TIERS.map((tier) => (
          <div
            key={tier}
            className="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-800"
          >
            <div className="text-xs capitalize text-gray-500 dark:text-gray-400">
              {tier}
            </div>
            <div className="mt-1 font-mono text-sm font-semibold" aria-live="polite">
              {prices ? formatPrice(prices[tier]) : loading ? 'Loading…' : '—'}
            </div>
          </div>
        ))}
      </div>

      {unit === 'USD' && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Approximate cost of a 21,000-gas transfer using an estimated{' '}
          {chain.nativeToken} price of ${tokenPrice.toLocaleString()}.
        </p>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">24-hour trend</h3>
          {recentHistory.length < 2 && (
            <span className="text-xs text-gray-500">
              Collecting history ({recentHistory.length} sample
              {recentHistory.length === 1 ? '' : 's'})
            </span>
          )}
        </div>
        <GasTrendChart points={recentHistory} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400" htmlFor="gas-alert-threshold">
            Alert above (Gwei)
          </label>
          <input
            id="gas-alert-threshold"
            className="mt-1 w-28 rounded border border-gray-300 bg-transparent px-2 py-1 font-mono dark:border-gray-600"
            type="number"
            min="0"
            step="0.1"
            value={alertThreshold}
            onChange={(event) => {
              const threshold = Number(event.target.value);
              if (Number.isFinite(threshold) && threshold >= 0) {
                setAlertThreshold(threshold);
              }
            }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {updatedAt ? (
            <>
              Updated{' '}
              <time dateTime={new Date(updatedAt).toISOString()}>
                {formatTimestamp(updatedAt)}
              </time>
            </>
          ) : (
            'Not updated yet'
          )}
        </p>
      </div>

      {standardPrice !== undefined && standardPrice > alertThreshold && (
        <p className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="alert">
          Standard gas price is {standardPrice.toFixed(2)} Gwei, above your{' '}
          {alertThreshold.toLocaleString()} Gwei alert threshold.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 dark:text-red-300" role="status">
          {error}
        </p>
      )}
    </section>
  );
}

export default GasPriceTracker;
