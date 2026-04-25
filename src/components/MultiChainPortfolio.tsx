'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, ExternalLink, Filter } from 'lucide-react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useWalletStore } from '@/store/walletStore';
import { CHAIN_CONFIG, type ChainId } from '@/config/chains';
import { formatPrice } from '@/utils/searchUtils';
import type { ChainPortfolio, BridgeSuggestion } from '@/types/portfolio';

export const MultiChainPortfolio: React.FC = () => {
  const { 
    portfolio, 
    selectedChain, 
    bridgeSuggestions, 
    isLoading, 
    error, 
    loadPortfolio, 
    refreshPortfolio, 
    setSelectedChain 
  } = usePortfolioStore();
  
  const { address, isConnected } = useWalletStore();
  const [showBridgeSuggestions, setShowBridgeSuggestions] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadPortfolio(address);
    }
  }, [isConnected, address, loadPortfolio]);

  const filteredChains = React.useMemo(() => {
    if (!portfolio) return [];
    
    if (selectedChain === 'all') {
      return portfolio.chains;
    }
    
    return portfolio.chains.filter(chain => chain.chainId === selectedChain);
  }, [portfolio, selectedChain]);

  const handleRefresh = () => {
    refreshPortfolio();
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>Connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error || 'Failed to load portfolio'}
        </p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio Overview
          </h2>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Value (USD)
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {formatPrice(portfolio.totalValueUSD)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Properties
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {portfolio.chains.reduce((sum, chain) => sum + chain.holdings.length, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Chains Used
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {portfolio.chains.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chain Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter by Chain
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedChain('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedChain === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Chains ({portfolio.chains.length})
          </button>
          
          {portfolio.chains.map((chain) => (
            <button
              key={chain.chainId}
              onClick={() => setSelectedChain(chain.chainId)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedChain === chain.chainId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: chain.chainColor }}
              />
              {chain.chainName} ({chain.holdings.length})
            </button>
          ))}
        </div>
      </div>

      {/* Chain Portfolios */}
      <div className="space-y-4">
        {filteredChains.map((chain) => (
          <ChainPortfolioCard key={chain.chainId} chain={chain} />
        ))}
      </div>

      {/* Bridge Suggestions */}
      {bridgeSuggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bridge Suggestions
              </h3>
            </div>
            <button
              onClick={() => setShowBridgeSuggestions(!showBridgeSuggestions)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {showBridgeSuggestions ? 'Hide' : 'Show'}
            </button>
          </div>

          {showBridgeSuggestions && (
            <div className="space-y-3">
              {bridgeSuggestions.map((suggestion, index) => (
                <BridgeSuggestionCard key={index} suggestion={suggestion} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ChainPortfolioCardProps {
  chain: ChainPortfolio;
}

const ChainPortfolioCard: React.FC<ChainPortfolioCardProps> = ({ chain }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: chain.chainColor }}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chain.chainName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {chain.holdings.length} properties
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Value
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPrice(chain.totalValueUSD)}
          </p>
        </div>
      </div>

      {/* Gas Balance */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gas Balance
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {chain.gasBalance} {chain.chainSymbol}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Value in USD
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatPrice(chain.gasBalanceUSD)}
            </p>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="space-y-3">
        {chain.holdings.map((holding) => (
          <div key={holding.propertyId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold">
                  {holding.tokenSymbol}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {holding.propertyName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {holding.quantity} tokens
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">
                {formatPrice(holding.valueUSD)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {holding.valueNative.toFixed(4)} {chain.chainSymbol}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BridgeSuggestionCardProps {
  suggestion: BridgeSuggestion;
}

const BridgeSuggestionCard: React.FC<BridgeSuggestionCardProps> = ({ suggestion }) => {
  return (
    <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="font-medium text-gray-900 dark:text-white">
              {suggestion.propertyName}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {suggestion.reason}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              From: {CHAIN_CONFIG[suggestion.fromChain].name}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              To: {CHAIN_CONFIG[suggestion.toChain].name}
            </span>
            <span className="font-medium text-green-600">
              Save: {formatPrice(suggestion.potentialSavings)}
            </span>
          </div>
        </div>
        <button className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors">
          Bridge
        </button>
      </div>
    </div>
  );
};
