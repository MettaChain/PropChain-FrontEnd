'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface CurrencyToggleProps {
  ethAmount: number;
  showBoth?: boolean;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ 
  ethAmount, 
  showBoth = false 
}) => {
  const [currency, setCurrency] = React.useState<'ETH' | 'USD'>('ETH');
  const { ethToUsdRate, isLoading, formatEthPrice, formatUsdPrice } = useCurrencyConverter();

  // Load saved preference from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('currencyPreference');
    if (saved === 'ETH' || saved === 'USD') {
      setCurrency(saved);
    }
  }, []);

  const handleToggle = () => {
    const newCurrency = currency === 'ETH' ? 'USD' : 'ETH';
    setCurrency(newCurrency);
    localStorage.setItem('currencyPreference', newCurrency);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Loading...</span>
      </div>
    );
  }

  const usdPrice = formatUsdPrice(ethAmount);
  const ethPrice = formatEthPrice(ethAmount);

  if (showBoth) {
    return (
      <div className="group relative">
        <div className="flex flex-col items-start gap-1">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {ethPrice}
          </div>
          {usdPrice && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ≈ {usdPrice} (1 ETH = ${ethToUsdRate?.toFixed(2)} USD)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="h-8 px-3 text-xs font-medium"
        title={`Switch to ${currency === 'ETH' ? 'USD' : 'ETH'}`}
      >
        {currency === 'ETH' ? (
          <>
            <span>{ethPrice}</span>
            <span className="ml-1 text-xs opacity-60">→ $</span>
          </>
        ) : (
          <>
            <span>{usdPrice || ethPrice}</span>
            <span className="ml-1 text-xs opacity-60">→ ETH</span>
          </>
        )}
      </Button>
      
      {/* Hover tooltip showing both values */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="text-center">
          <div>{ethPrice}</div>
          {usdPrice && (
            <div className="text-gray-300">
              ≈ {usdPrice}
            </div>
          )}
          {ethToUsdRate && (
            <div className="text-gray-400 text-xs mt-1">
              1 ETH = ${ethToUsdRate.toFixed(2)} USD
            </div>
          )}
        </div>
        </div>
      </div>
    );
};
