'use client';

import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { mainnet, polygon, bsc } from 'wagmi/chains';

const CHAINS = [mainnet, polygon, bsc];
// Static placeholder rates, same approach as src/components/MultiCurrencyBalance.tsx.
const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79 };
const USD_PRICE: Record<number, number> = { [mainnet.id]: 3000, [polygon.id]: 0.85, [bsc.id]: 600 };

const timeAgo = (ts: number): string => {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const ChainRow: React.FC<{
  address: `0x${string}`;
  chainId: number;
  currency: string;
  onUpdated: (ts: number) => void;
  refreshKey: number;
}> = ({ address, chainId, currency, onUpdated, refreshKey }) => {
  const { data, isFetching } = useBalance({ address, chainId });
  React.useEffect(() => {
    if (data) onUpdated(Date.now());
  }, [data, refreshKey, onUpdated]);
  const amount = data ? parseFloat(data.formatted) : 0;
  const fiat = amount * (USD_PRICE[chainId] ?? 0) * (RATES[currency] ?? 1);
  return (
    <li className="flex justify-between py-1">
      <span>{data ? `${amount.toFixed(4)} ${data.symbol}` : isFetching ? '...' : '-'}</span>
      <span>{fiat.toFixed(2)} {currency}</span>
    </li>
  );
};

export const WalletBalanceCard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [currency, setCurrency] = useState('USD');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isConnected || !address) {
    return <div className="p-4 border rounded">Connect your wallet to view balances.</div>;
  }

  const refresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="p-4 border rounded">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => void navigator.clipboard.writeText(address)}>
          {address.slice(0, 6)}...{address.slice(-4)} (copy)
        </button>
        <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {Object.keys(RATES).map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <ul>
        {CHAINS.map((c) => (
          <ChainRow key={c.id} address={address} chainId={c.id} currency={currency}
            refreshKey={refreshKey} onUpdated={setUpdatedAt} />
        ))}
      </ul>
      <div className="flex justify-between items-center mt-2 text-sm">
        <span>{updatedAt ? `Updated ${timeAgo(updatedAt)}` : 'Not updated yet'}</span>
        <button type="button" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default WalletBalanceCard;
