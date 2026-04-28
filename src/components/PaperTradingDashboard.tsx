'use client';

import { useState } from 'react';
import { usePaperTradingStore, type LeaderboardEntry } from '@/store/paperTradingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MOCK_PROPERTIES } from '@/lib/mockData';

// Simulated leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { userId: 'user-1', displayName: 'Alice', startingBalance: 10000, currentBalance: 13200, totalReturn: 32, rank: 1 },
  { userId: 'user-2', displayName: 'Bob', startingBalance: 10000, currentBalance: 11800, totalReturn: 18, rank: 2 },
  { userId: 'user-3', displayName: 'Carol', startingBalance: 10000, currentBalance: 11200, totalReturn: 12, rank: 3 },
  { userId: 'user-4', displayName: 'Dave', startingBalance: 10000, currentBalance: 10500, totalReturn: 5, rank: 4 },
  { userId: 'user-5', displayName: 'Eve', startingBalance: 10000, currentBalance: 9800, totalReturn: -2, rank: 5 },
];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function PaperTradingDashboard() {
  const {
    isPaperMode,
    virtualBalance,
    positions,
    transactions,
    buyTokens,
    sellTokens,
    updatePrice,
    resetPortfolio,
    getPortfolioValue,
    getTotalReturn,
    getPositionPnL,
  } = usePaperTradingStore();

  const [selectedPropertyId, setSelectedPropertyId] = useState(MOCK_PROPERTIES[0]?.id ?? '');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');

  if (!isPaperMode) return null;

  const selectedProperty = MOCK_PROPERTIES.find((p) => p.id === selectedPropertyId);
  const portfolioValue = getPortfolioValue();
  const totalReturn = getTotalReturn();
  const totalAssets = virtualBalance + portfolioValue;

  function handleBuy() {
    setTradeError('');
    setTradeSuccess('');
    if (!selectedProperty) return;
    const tokens = parseFloat(tokenAmount);
    if (isNaN(tokens) || tokens <= 0) {
      setTradeError('Enter a valid token amount');
      return;
    }
    // Sync current price
    updatePrice(selectedProperty.id, selectedProperty.price.perToken);
    const result = buyTokens(selectedProperty.id, selectedProperty.name, tokens, selectedProperty.price.perToken);
    if (result.success) {
      setTradeSuccess(`Bought ${tokens} tokens of ${selectedProperty.name}`);
      setTokenAmount('');
    } else {
      setTradeError(result.error ?? 'Trade failed');
    }
  }

  function handleSell() {
    setTradeError('');
    setTradeSuccess('');
    if (!selectedProperty) return;
    const tokens = parseFloat(tokenAmount);
    if (isNaN(tokens) || tokens <= 0) {
      setTradeError('Enter a valid token amount');
      return;
    }
    const result = sellTokens(selectedProperty.id, tokens, selectedProperty.price.perToken);
    if (result.success) {
      setTradeSuccess(`Sold ${tokens} tokens of ${selectedProperty.name}`);
      setTokenAmount('');
    } else {
      setTradeError(result.error ?? 'Trade failed');
    }
  }

  // Build leaderboard with current user injected
  const myEntry: LeaderboardEntry = {
    userId: 'me',
    displayName: 'You',
    startingBalance: 10000,
    currentBalance: totalAssets,
    totalReturn,
    rank: 0,
  };
  const combined = [...MOCK_LEADERBOARD, myEntry]
    .sort((a, b) => b.totalReturn - a.totalReturn)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Paper Trading Dashboard</h2>
        <Badge variant="secondary">Simulation Mode</Badge>
      </div>

      {/* Virtual Wallet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(virtualBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(portfolioValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pct(totalReturn)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trade Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Simulate Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Property</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              {MOCK_PROPERTIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fmt(p.price.perToken)}/token
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Token Amount</label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />
            {selectedProperty && tokenAmount && !isNaN(parseFloat(tokenAmount)) && (
              <p className="text-xs text-muted-foreground mt-1">
                Cost: {fmt(parseFloat(tokenAmount) * selectedProperty.price.perToken)}
              </p>
            )}
          </div>
          {tradeError && <p className="text-sm text-red-600">{tradeError}</p>}
          {tradeSuccess && <p className="text-sm text-green-600">{tradeSuccess}</p>}
          <div className="flex gap-2">
            <Button onClick={handleBuy} className="flex-1">Buy</Button>
            <Button onClick={handleSell} variant="outline" className="flex-1">Sell</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={resetPortfolio} className="w-full text-muted-foreground">
            Reset Portfolio
          </Button>
        </CardContent>
      </Card>

      {/* Positions */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {positions.map((pos) => {
                const pnl = getPositionPnL(pos.propertyId);
                return (
                  <div key={pos.propertyId} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{pos.propertyName}</p>
                      <p className="text-muted-foreground">{pos.tokensBought} tokens @ {fmt(pos.avgBuyPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{fmt(pos.tokensBought * pos.currentPrice)}</p>
                      <p className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactions.slice(0, 20).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                  <div>
                    <Badge variant={tx.type === 'buy' ? 'default' : 'secondary'} className="mr-2 text-xs">
                      {tx.type.toUpperCase()}
                    </Badge>
                    <span>{tx.propertyName}</span>
                  </div>
                  <div className="text-right">
                    <p>{tx.tokens} tokens</p>
                    <p className="text-muted-foreground">{fmt(tx.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {combined.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between text-sm p-2 rounded-md ${entry.userId === 'me' ? 'bg-muted font-semibold' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-muted-foreground">#{entry.rank}</span>
                  <span>{entry.displayName}</span>
                  {entry.userId === 'me' && <Badge variant="outline" className="text-xs">You</Badge>}
                </div>
                <div className="text-right">
                  <p>{fmt(entry.currentBalance)}</p>
                  <p className={entry.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>{pct(entry.totalReturn)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
