'use client';

import React from 'react';
import { useChain } from '@/providers/ChainAwareProvider';
import { useWalletStore } from '@/store/walletStore';
import { logger } from '@/utils/logger';

interface ChainAwareProps {
  children: (props: {
    chainId: number;
    chainName: string;
    chainSymbol: string;
    chainColor: string;
    isConnected: boolean;
    address: string | null;
    balance: string | null;
  }) => React.ReactNode;
  fallback?: React.ReactNode;
}

export const ChainAware: React.FC<ChainAwareProps> = ({ children, fallback }) => {
  const { currentChain, chainConfig } = useChain();
  const { isConnected, address, balance } = useWalletStore();

  if (!isConnected && fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      {children({
        chainId: currentChain,
        chainName: chainConfig.name,
        chainSymbol: chainConfig.symbol,
        chainColor: chainConfig.color,
        isConnected,
        address,
        balance,
      })}
    </>
  );
};

interface ChainSpecificProps {
  chainId: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ChainSpecific: React.FC<ChainSpecificProps> = ({ chainId, children, fallback }) => {
  const { currentChain } = useChain();

  if (currentChain !== chainId) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface MultiChainProps {
  children: React.ReactNode;
  className?: string;
}

export const MultiChainBadge: React.FC<MultiChainProps> = ({ children, className = '' }) => {
  const { currentChain, chainConfig } = useChain();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: chainConfig.color }}
      />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {chainConfig.name}
      </span>
      {children}
    </div>
  );
};

interface GasEstimationProps {
  gasLimit?: string;
  className?: string;
}

export const GasEstimation: React.FC<GasEstimationProps> = ({ gasLimit = '21000', className = '' }) => {
  const { currentChain, chainConfig } = useChain();

  const getGasPrice = () => {
    switch (currentChain) {
      case 1: // Ethereum
        return '20';
      case 137: // Polygon
        return '30';
      case 56: // BSC
        return '5';
      default:
        return '20';
    }
  };

  const gasPrice = getGasPrice();
  const gasCost = (parseInt(gasLimit) * parseInt(gasPrice)) / 1e9;

  return (
    <div className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      Est. gas: {gasCost.toFixed(6)} {chainConfig.symbol}
    </div>
  );
};

interface TransactionButtonProps {
  onTransaction: () => Promise<void>;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const TransactionButton: React.FC<TransactionButtonProps> = ({
  onTransaction,
  disabled = false,
  children,
  className = '',
}) => {
  const { currentChain, chainConfig } = useChain();
  const { isConnected, isConnecting } = useWalletStore();
  const [isPending, setIsPending] = React.useState(false);

  const handleClick = async () => {
    if (!isConnected) return;
    
    setIsPending(true);
    try {
      await onTransaction();
    } catch (error) {
      logger.error('Transaction failed:', error);
    } finally {
      setIsPending(false);
    }
  };

  const isDisabled = disabled || !isConnected || isConnecting || isPending;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isDisabled 
          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105'
        }
        ${className}
      `}
      style={{
        backgroundColor: !isDisabled ? chainConfig.color : undefined,
      }}
    >
      {isPending ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  );
};
