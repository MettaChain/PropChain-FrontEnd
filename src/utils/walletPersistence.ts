'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { ChainId } from '@/config/chains';

export const useWalletPersistence = () => {
  const {
    isConnected,
    address,
    walletType,
    chainId,
    setConnected,
    setDisconnected,
    setError,
  } = useWalletStore();

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0 && isConnected && address) {
          const currentChainId = await window.ethereum.request({
            method: 'eth_chainId',
          });
          
          const currentChainIdNumber = parseInt(currentChainId, 16);
          
          if (accounts[0].toLowerCase() === address.toLowerCase()) {
            setConnected(accounts[0], walletType, currentChainIdNumber as ChainId);
          } else {
            setDisconnected();
          }
        } else if (accounts.length === 0 && isConnected) {
          setDisconnected();
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
        if (isConnected) {
          setDisconnected();
        }
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setDisconnected();
        } else if (accounts[0] !== address) {
          setConnected(accounts[0], walletType, chainId);
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setConnected(address || '', walletType, newChainId as ChainId);
      };

      const handleDisconnect = () => {
        setDisconnected();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [isConnected, address, walletType, chainId, setConnected, setDisconnected, setError]);
};
