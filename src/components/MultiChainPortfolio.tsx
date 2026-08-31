'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingUp, AlertTriangle, ExternalLink, Filter, Wallet, Briefcase } from 'lucide-react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useWalletStore } from '@/store/walletStore';
import { CHAIN_CONFIG, type ChainId } from '@/config/chains';
import { formatPrice } from '@/utils/searchUtils';
import type { ChainPortfolio, BridgeSuggestion } from '@/types/portfolio';
import { EmptyState } from '@/components/ui/EmptyState';

const MultiChainPortfolioInner: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  const handleRefresh = useCallback(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  if (!isConnected) {
    return (
      <EmptyState
        title={t('multiChainPortfolio.connectWalletTitle')}
        description={t('multiChainPortfolio.connectWalletDescription')}
        icon={Wallet}
        action={{
          label: t('multiChainPortfolio.connectWalletAction'),
          onClick: () => {
            // This would typically trigger the wallet connection modal
          }
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t('multiChainPortfolio.loadingPortfolio')}</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <EmptyState
        title={t('multiChainPortfolio.failedToLoad')}
        description={error || t('multiChainPortfolio.failedToLoadDescription')}
        icon={AlertTriangle}
        action={{
          label: t('multiChainPortfolio.tryAgain'),
          onClick: handleRefresh
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      />
    );
  }

  const totalHoldings = portfolio.chains.reduce((sum, chain) => sum + chain.holdings.length, 0);

  if (totalHoldings === 0) {
    return (
      <EmptyState
        title={t('multiChainPortfolio.noInvestmentsTitle')}
        description={t('multiChainPortfolio.noInvestmentsDescription')}
        icon={Briefcase}
        action={{
          label: t('multiChainPortfolio.browseProperties'),
          href: "/properties"
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      />
    );
  }

  return (
    <div className="space-y-6" dir={i18n.dir()}>
      {/* Portfolio Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('multiChainPortfolio.portfolioOverview')}
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
              {t('multiChainPortfolio.totalValueUSD')}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {formatPrice(portfolio.totalValueUSD)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('multiChainPortfolio.totalProperties')}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {portfolio.chains.reduce((sum, chain) => sum + chain.holdings.length, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('multiChainPortfolio.chainsUsed')}
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
            {t('multiChainPortfolio.filterByChain')}
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
            {t('multiChainPortfolio.allChainsWithCount', { count: portfolio.chains.length })}
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
              {chain.chainName} ({t('multiChainPortfolio.properties', { count: chain.holdings.length })})
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
                {t('multiChainPortfolio.bridgeSuggestions')}
              </h3>
            </div>
            <button
              onClick={() => setShowBridgeSuggestions(!showBridgeSuggestions)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {showBridgeSuggestions ? t('multiChainPortfolio.hide') : t('multiChainPortfolio.show')}
            </button>
          </div>

          {showBridgeSuggestions && (
            <div className="space-y-3">
              {bridgeSuggestions.map((suggestion) => (
                <BridgeSuggestionCard key={`${suggestion.propertyId}-${suggestion.fromChain}-${suggestion.toChain}`} suggestion={suggestion} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MultiChainPortfolio = React.memo(MultiChainPortfolioInner);

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
              {t('multiChainPortfolio.properties', { count: chain.holdings.length })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('multiChainPortfolio.totalValue')}
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
              {t('multiChainPortfolio.gasBalance')}
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {chain.gasBalance} {chain.chainSymbol}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('multiChainPortfolio.valueInUSD')}
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
                  {t('multiChainPortfolio.tokens', { count: holding.quantity })}
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
              {t('multiChainPortfolio.fromLabel', { chain: CHAIN_CONFIG[suggestion.fromChain].name })}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('multiChainPortfolio.toLabel', { chain: CHAIN_CONFIG[suggestion.toChain].name })}
            </span>
            <span className="font-medium text-green-600">
              {t('multiChainPortfolio.saveAmount', { amount: formatPrice(suggestion.potentialSavings) })}
            </span>
          </div>
        </div>
        <button className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors">
          {t('multiChainPortfolio.bridgeAction')}
        </button>
      </div>
    </div>
  );
};
