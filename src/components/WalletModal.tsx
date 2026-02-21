'use client';

import React from 'react';
import { useWalletStore } from '@/store/walletStore';
import { getWalletErrorMessage } from '@/utils/errorHandling';
import { toChainId } from '@/config/chains';
import { getErrorCode } from '@/utils/typeGuards';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { setConnecting, setConnected, setError } = useWalletStore();

  type SupportedWalletId = 'metamask' | 'walletconnect' | 'coinbase';

  const connectWallet = async (walletType: SupportedWalletId) => {
    try {
      setConnecting(true);
      setError(null);

      if (walletType === 'metamask') {
        await connectMetaMask();
      } else if (walletType === 'walletconnect') {
        await connectWalletConnect();
      } else if (walletType === 'coinbase') {
        await connectCoinbase();
      }
    } catch (error: unknown) {
      setError(getWalletErrorMessage(error));
    } finally {
      setConnecting(false);
      onClose();
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request<string[]>({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum.request<string>({
        method: 'eth_chainId',
      });

      if (!Array.isArray(accounts) || accounts.length === 0 || typeof accounts[0] !== 'string') {
        throw new Error('Wallet returned an invalid account response');
      }

      if (typeof chainId !== 'string') {
        throw new Error('Wallet returned an invalid chain id response');
      }

      const address = accounts[0];
      const chainIdNumber = parseInt(chainId, 16);
      const parsedChainId = toChainId(chainIdNumber);

      if (!parsedChainId) {
        throw new Error(`Unsupported network (chain ${chainIdNumber})`);
      }

      setConnected(address, 'metamask', parsedChainId);
    } catch (error: unknown) {
      if (getErrorCode(error) === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  };

  const connectWalletConnect = async () => {
    throw new Error('WalletConnect v2 integration needed. Please implement with @walletconnect/web3-provider v2');
  };

  const connectCoinbase = async () => {
    if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet is not installed');
    }

    try {
      const accounts = await window.ethereum.request<string[]>({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum.request<string>({
        method: 'eth_chainId',
      });

      if (!Array.isArray(accounts) || accounts.length === 0 || typeof accounts[0] !== 'string') {
        throw new Error('Wallet returned an invalid account response');
      }

      if (typeof chainId !== 'string') {
        throw new Error('Wallet returned an invalid chain id response');
      }

      const address = accounts[0];
      const chainIdNumber = parseInt(chainId, 16);
      const parsedChainId = toChainId(chainIdNumber);

      if (!parsedChainId) {
        throw new Error(`Unsupported network (chain ${chainIdNumber})`);
      }

      setConnected(address, 'coinbase', parsedChainId);
    } catch (error: unknown) {
      if (getErrorCode(error) === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  };

  const wallets: Array<{
    id: SupportedWalletId;
    name: string;
    description: string;
    icon: string;
    color: string;
  }> = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect to your MetaMask wallet',
      icon: '🦊',
      color: 'bg-orange-500',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with WalletConnect',
      icon: '🔗',
      color: 'bg-blue-500',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect to your Coinbase wallet',
      icon: '🔵',
      color: 'bg-blue-600',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => connectWallet(wallet.id)}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`w-12 h-12 ${wallet.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {wallet.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {wallet.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {wallet.description}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">New to Web3?</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Select a wallet provider above to get started with blockchain transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
