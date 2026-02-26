'use client';

import React, { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { useWalletStore } from '@/store/walletStore';
import { useChain } from '@/providers/ChainAwareProvider';
import { logger } from '@/utils/logger';

const WalletModal = dynamic(
  () => import("./WalletModal").then((m) => m.WalletModal),
  { ssr: false }
);
const NetworkSwitcher = dynamic(
  () => import("./NetworkSwitcher").then((m) => m.NetworkSwitcher),
  { ssr: false }
);

export const WalletConnector: React.FC = () => {
  const {
    isConnected,
    address,
    isConnecting,
    error,
    setDisconnected,
    clearError,
    setBalance,
  } = useWalletStore();

  const { currentChain, chainConfig } = useChain();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      updateBalance();
    }
  }, [isConnected, address, currentChain]);

  const updateBalance = async () => {
    try {
      if (window.ethereum && address) {
        const balance = await window.ethereum.request<string>({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });

        if (typeof balance !== 'string') {
          throw new Error('Invalid balance response');
        }

        const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
        setBalance(balanceInEth.toFixed(4));
      }
    } catch (error) {
      logger.error('Failed to fetch balance:', error);
    }
  };

  const handleDisconnect = () => {
    setDisconnected();
    clearError();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <NetworkSwitcher />
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: chainConfig.color }}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {chainConfig.symbol}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {parseFloat(useWalletStore.getState().balance || '0').toFixed(3)}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {formatAddress(address)}
          </span>
        </div>

        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          Disconnect
        </button>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isConnecting}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};
