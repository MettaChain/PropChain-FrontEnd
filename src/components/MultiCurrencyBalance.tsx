'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, ChevronDown } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useChain } from '@/providers/ChainAwareProvider';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue?: string;
  price?: number;
}

export const MultiCurrencyBalance: React.FC = () => {
  const { balance, address, chainId } = useWalletStore();
  const { chainConfig } = useChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'native' | 'usd'>('native');
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [usdPrice, setUsdPrice] = useState<number>(0);

  useEffect(() => {
    if (!address || !balance) return;

    // Fetch USD price for the native token
    fetchUsdPrice();
    
    // Simulate fetching multiple token balances
    fetchTokenBalances();
  }, [address, balance, chainId]);

  const fetchUsdPrice = async () => {
    try {
      // In production, use a real price API like CoinGecko
      const mockPrices: Record<number, number> = {
        1: 3000, // ETH
        137: 0.85, // MATIC
        56: 600, // BNB
      };
      const price = mockPrices[chainId] || 2000;
      setUsdPrice(price);
    } catch (error) {
      console.error('Failed to fetch USD price:', error);
    }
  };

  const fetchTokenBalances = async () => {
    if (!address) return;

    // Mock token balances - in production, fetch from blockchain
    const balances: TokenBalance[] = [
      {
        symbol: chainConfig.symbol,
        name: chainConfig.name,
        balance: balance || '0',
        usdValue: (parseFloat(balance || '0') * usdPrice).toFixed(2),
        price: usdPrice,
      },
    ];

    // Add other tokens if on Ethereum mainnet
    if (chainId === 1) {
      balances.push({
        symbol: 'USDT',
        name: 'Tether USD',
        balance: '150.00',
        usdValue: '150.00',
        price: 1,
      });
      balances.push({
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '250.00',
        usdValue: '250.00',
        price: 1,
      });
    }

    setTokenBalances(balances);
  };

  const getNativeBalance = () => {
    return tokenBalances.find((t) => t.symbol === chainConfig.symbol);
  };

  const getTotalUsdValue = () => {
    return tokenBalances.reduce((total, token) => {
      return total + parseFloat(token.usdValue || '0');
    }, 0);
  };

  const isLowBalance = () => {
    const nativeBalance = getNativeBalance();
    return nativeBalance && parseFloat(nativeBalance.balance) < 0.01;
  };

  if (!address) return null;

  const nativeBalance = getNativeBalance();

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Wallet className="w-4 h-4 text-blue-600" />
        <div className="text-left">
          {displayCurrency === 'native' ? (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {nativeBalance?.balance || '0'} {chainConfig.symbol}
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ${getTotalUsdValue().toFixed(2)}
            </div>
          )}
          {isLowBalance() && (
            <div className="text-xs text-red-600 dark:text-red-400">Low balance</div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Wallet Balance
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDisplayCurrency('native')}
                    className={`text-xs px-2 py-1 rounded ${
                      displayCurrency === 'native'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {chainConfig.symbol}
                  </button>
                  <button
                    onClick={() => setDisplayCurrency('usd')}
                    className={`text-xs px-2 py-1 rounded ${
                      displayCurrency === 'usd'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${getTotalUsdValue().toFixed(2)}
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Token Balances
              </h4>
              <div className="space-y-2">
                {tokenBalances.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {token.balance} {token.symbol}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {token.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${token.usdValue}
                      </div>
                      {token.price && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          @{token.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isLowBalance() && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Low Balance Warning
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Your {chainConfig.symbol} balance is low. You may need more for transaction fees.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
