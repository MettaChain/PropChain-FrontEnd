'use client';

import React, { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useChain } from '@/providers/ChainAwareProvider';
import { SUPPORTED_CHAINS, toChainId } from '@/config/chains';

export const NetworkSwitcher: React.FC = () => {
  const { isSwitchingNetwork } = useWalletStore();
  const { currentChain, chainConfig, switchChain, getChainName, getChainColor } = useChain();
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkSwitch = async (chainId: number) => {
    setIsOpen(false);
    const parsedChainId = toChainId(chainId);
    if (parsedChainId) {
      await switchChain(parsedChainId);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitchingNetwork}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: chainConfig.color }}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {chainConfig.name}
        </span>
        {isSwitchingNetwork ? (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Select Network
              </div>
              {SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleNetworkSwitch(chain.id)}
                  disabled={chain.id === currentChain || isSwitchingNetwork}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    chain.id === currentChain
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } disabled:opacity-50`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getChainColor(chain.id) }}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{chain.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {chain.nativeCurrency.symbol}
                    </div>
                  </div>
                  {chain.id === currentChain && (
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
