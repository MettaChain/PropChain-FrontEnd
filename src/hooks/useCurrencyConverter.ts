'use client';

import { useState, useEffect } from 'react';

interface CoinGeckoResponse {
  ethereum: {
    usd: number;
  };
}

export const useCurrencyConverter = () => {
  const [ethToUsdRate, setEthToUsdRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchExchangeRate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CoinGeckoResponse = await response.json();
      
      if (data.ethereum?.usd) {
        setEthToUsdRate(data.ethereum.usd);
        setLastUpdated(new Date());
        
        // Save to localStorage
        localStorage.setItem('ethToUsdRate', data.ethereum.usd.toString());
        localStorage.setItem('ethToUsdLastUpdated', new Date().toISOString());
      }
    } catch (err) {
      console.error('Error fetching ETH price:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      
      // Try to use cached rate
      const cachedRate = localStorage.getItem('ethToUsdRate');
      const cachedDate = localStorage.getItem('ethToUsdLastUpdated');
      
      if (cachedRate && cachedDate) {
        setEthToUsdRate(parseFloat(cachedRate));
        setLastUpdated(new Date(cachedDate));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have cached data that's less than 60 seconds old
    const cachedRate = localStorage.getItem('ethToUsdRate');
    const cachedDate = localStorage.getItem('ethToUsdLastUpdated');
    
    if (cachedRate && cachedDate) {
      const lastUpdate = new Date(cachedDate);
      const now = new Date();
      const diffInSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
      
      if (diffInSeconds < 60) {
        setEthToUsdRate(parseFloat(cachedRate));
        setLastUpdated(lastUpdate);
        setIsLoading(false);
        return;
      }
    }
    
    fetchExchangeRate();
  }, []);

  // Auto-update every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchExchangeRate, 60000);
    return () => clearInterval(interval);
  }, []);

  const convertEthToUsd = (ethAmount: number): number | null => {
    if (ethToUsdRate === null) return null;
    return ethAmount * ethToUsdRate;
  };

  const formatEthPrice = (ethAmount: number): string => {
    return `${ethAmount.toFixed(4)} ETH`;
  };

  const formatUsdPrice = (ethAmount: number): string | null => {
    const usdAmount = convertEthToUsd(ethAmount);
    if (usdAmount === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdAmount);
  };

  return {
    ethToUsdRate,
    isLoading,
    error,
    lastUpdated,
    convertEthToUsd,
    formatEthPrice,
    formatUsdPrice,
    refetch: fetchExchangeRate,
  };
};
