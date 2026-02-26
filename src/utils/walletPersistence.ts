'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { toChainId } from '@/config/chains';
import { logger } from './logger';

export const useWalletPersistence = () => {
  const {
    isConnected,
    address,
    walletType,
    chainId,
    setConnected,
    setDisconnected,
  } = useWalletStore();

  useEffect(() => {
    const provider = window.ethereum;

    const checkWalletConnection = async (): Promise<void> => {
      if (!provider) {
        return;
      }

      try {
        const accounts = await provider.request<string[]>({
          method: 'eth_accounts',
        });

        if (!Array.isArray(accounts) || accounts.some((account) => typeof account !== 'string')) {
          throw new Error('Invalid wallet accounts response');
        }

        if (accounts.length > 0 && isConnected && address) {
          const currentChainId = await provider.request<string>({
            method: 'eth_chainId',
          });

          if (typeof currentChainId !== 'string') {
            throw new Error('Invalid wallet chain response');
          }

          const currentChainIdNumber = parseInt(currentChainId, 16);
          const parsedChainId = toChainId(currentChainIdNumber);
          
          if (!parsedChainId) {
            setDisconnected();
            return;
          }

          if (accounts[0]?.toLowerCase() === address.toLowerCase()) {
            setConnected(accounts[0], walletType, parsedChainId);
          } else {
            setDisconnected();
          }
        } else if (accounts.length === 0 && isConnected) {
          setDisconnected();
        }
      } catch (error) {
        logger.error('Failed to check wallet connection:', error);
        if (isConnected) {
          setDisconnected();
        }
      }
    };

    checkWalletConnection();

    if (!provider) {
      return undefined;
    }

    const handleAccountsChanged = (accountsValue: unknown) => {
      if (!Array.isArray(accountsValue)) {
        setDisconnected();
        return;
      }

      const accounts = accountsValue.filter(
        (account): account is string => typeof account === 'string'
      );

      if (accounts.length === 0) {
        setDisconnected();
      } else if (accounts[0] && accounts[0] !== address) {
        setConnected(accounts[0], walletType, chainId);
      }
    };

    const handleChainChanged = (newChainHex: unknown) => {
      if (typeof newChainHex !== 'string') {
        setDisconnected();
        return;
      }

      if (!address) {
        setDisconnected();
        return;
      }

      const newChainId = parseInt(newChainHex, 16);
      const parsedChainId = toChainId(newChainId);
      if (!parsedChainId) {
        setDisconnected();
        return;
      }

      setConnected(address, walletType, parsedChainId);
    };

    const handleDisconnect = () => {
      setDisconnected();
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);
    provider.on?.('disconnect', handleDisconnect);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
      provider.removeListener?.('disconnect', handleDisconnect);
    };
  }, [isConnected, address, walletType, chainId, setConnected, setDisconnected]);
};
