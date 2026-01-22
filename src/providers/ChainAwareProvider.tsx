'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { ChainId, CHAIN_CONFIG, SUPPORTED_CHAINS } from '@/config/chains';
import { getWalletErrorMessage } from '@/utils/errorHandling';

interface ChainContextType {
  currentChain: ChainId;
  chainConfig: typeof CHAIN_CONFIG[ChainId];
  supportedChains: typeof SUPPORTED_CHAINS;
  isSupportedChain: (chainId: number) => boolean;
  switchChain: (chainId: ChainId) => Promise<void>;
  getChainName: (chainId: number) => string;
  getChainColor: (chainId: number) => string;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within a ChainAwareProvider');
  }
  return context;
};

interface ChainAwareProviderProps {
  children: React.ReactNode;
}

export const ChainAwareProvider: React.FC<ChainAwareProviderProps> = ({ children }) => {
  const { chainId, setChainId, setSwitchingNetwork, setError, isConnected } = useWalletStore();
  const [currentChain, setCurrentChain] = useState<ChainId>(chainId);

  useEffect(() => {
    setCurrentChain(chainId);
  }, [chainId]);

  const isSupportedChain = (chainId: number): boolean => {
    return chainId in CHAIN_CONFIG;
  };

  const switchChain = async (targetChainId: ChainId): Promise<void> => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (targetChainId === currentChain) {
      return;
    }

    try {
      setSwitchingNetwork(true);
      
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
        
        setChainId(targetChainId);
      } else {
        throw new Error('Wallet not available');
      }
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          const chainConfig = CHAIN_CONFIG[targetChainId];
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: chainConfig.name,
                nativeCurrency: {
                  name: chainConfig.symbol,
                  symbol: chainConfig.symbol,
                  decimals: chainConfig.decimals,
                },
                rpcUrls: [chainConfig.rpcUrl],
                blockExplorerUrls: [chainConfig.blockExplorer],
              },
            ],
          });
          
          setChainId(targetChainId);
        } catch (addError) {
          setError(getWalletErrorMessage(addError));
        }
      } else {
        setError(getWalletErrorMessage(error));
      }
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const getChainName = (chainId: number): string => {
    return CHAIN_CONFIG[chainId as ChainId]?.name || `Chain ${chainId}`;
  };

  const getChainColor = (chainId: number): string => {
    return CHAIN_CONFIG[chainId as ChainId]?.color || '#666666';
  };

  const value: ChainContextType = {
    currentChain,
    chainConfig: CHAIN_CONFIG[currentChain],
    supportedChains: SUPPORTED_CHAINS,
    isSupportedChain,
    switchChain,
    getChainName,
    getChainColor,
  };

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
