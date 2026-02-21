'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { CHAIN_CONFIG, SUPPORTED_CHAINS, isChainId, toChainId } from '@/config/chains';
import type { ChainId } from '@/config/chains';
import { getWalletErrorMessage } from '@/utils/errorHandling';
import { getErrorCode } from '@/utils/typeGuards';

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
    return isChainId(chainId);
  };

  const switchChain = async (targetChainId: ChainId): Promise<void> => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (targetChainId === currentChain) {
      return;
    }

    const provider = typeof window !== 'undefined' ? window.ethereum : undefined;

    try {
      setSwitchingNetwork(true);
      
      if (provider) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
        
        setChainId(targetChainId);
      } else {
        throw new Error('Wallet not available');
      }
    } catch (error: unknown) {
      if (getErrorCode(error) === 4902) {
        try {
          if (!provider) {
            throw new Error('Wallet not available');
          }

          const chainConfig = CHAIN_CONFIG[targetChainId];
          await provider.request({
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
    const validChain = toChainId(chainId);
    return validChain ? CHAIN_CONFIG[validChain].name : `Chain ${chainId}`;
  };

  const getChainColor = (chainId: number): string => {
    const validChain = toChainId(chainId);
    return validChain ? CHAIN_CONFIG[validChain].color : '#666666';
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
