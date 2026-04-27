'use client';

import React, { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { getWalletErrorMessage } from '@/utils/errorHandling';
import { toChainId } from '@/config/chains';
import { getErrorCode } from '@/utils/typeGuards';
import { useSecurity } from '@/hooks/useSecurity';
import { AlertTriangle, Shield, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalTransition } from './PageTransition';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { setConnecting, setConnected, setError, error } = useWalletStore();
  const { validateWalletConnection } = useSecurity();
  const [securityValidation, setSecurityValidation] = useState<{
    isValid: boolean;
    warnings: string[];
    blocks: string[];
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  type SupportedWalletId = 'metamask' | 'walletconnect' | 'coinbase';

  const connectWallet = async (walletType: SupportedWalletId) => {
    try {
      setIsConnecting(true);
      setConnecting(true);
      setError(null);
      setSecurityValidation(null);

      let address: string;
      let chainIdNumber: number;

      if (walletType === 'metamask') {
        const result = await connectMetaMask();
        address = result.address;
        chainIdNumber = result.chainId;
      } else if (walletType === 'walletconnect') {
        throw new Error('WalletConnect v2 integration needed. Please implement with @walletconnect/web3-provider v2');
      } else if (walletType === 'coinbase') {
        const result = await connectCoinbase();
        address = result.address;
        chainIdNumber = result.chainId;
      } else {
        throw new Error('Unsupported wallet type');
      }

      // Security validation before connecting
      const validation = await validateWalletConnection(address, walletType, chainIdNumber);
      setSecurityValidation(validation);

      if (!validation.isValid) {
        // Don't connect if security validation fails
        throw new Error('Security validation failed');
      }

      const parsedChainId = toChainId(chainIdNumber);
      if (!parsedChainId) {
        throw new Error(`Unsupported network (chain ${chainIdNumber})`);
      }

      setConnected(address, walletType, parsedChainId);
      onClose();
    } catch (error: unknown) {
      setError(getWalletErrorMessage(error));
    } finally {
      setIsConnecting(false);
      setConnecting(false);
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

      return { address, chainId: chainIdNumber };
    } catch (error: unknown) {
      if (getErrorCode(error) === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  };

  const renderSecurityStatus = () => {
    if (!securityValidation) return null;

    const { isValid, warnings, blocks } = securityValidation;

    if (!isValid) {
      return (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Connection Blocked
              </h4>
              <div className="space-y-1">
                {blocks.map((block, index) => (
                  <p key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {block}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (warnings.length > 0) {
      return (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Security Warnings
              </h4>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                    • {warning}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Security Verified
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Connection passed all security checks
            </p>
          </div>
        </div>
      </div>
    );
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

      return { address, chainId: chainIdNumber };
    } catch (error: unknown) {
      if (getErrorCode(error) === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  };

  // Detect installed wallets
  const detectInstalledWallets = () => {
    const installed = new Set<SupportedWalletId>();
    
    // Detect MetaMask
    if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
      installed.add('metamask');
    }
    
    // Detect Coinbase Wallet
    if (typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet) {
      installed.add('coinbase');
    }
    
    // WalletConnect is typically available through deep links or QR codes
    // We'll consider it "available" but not "installed" in the traditional sense
    
    return installed;
  };

  const installedWallets = detectInstalledWallets();

  const wallets: Array<{
    id: SupportedWalletId;
    name: string;
    description: string;
    icon: string;
    color: string;
    installUrl?: string;
  }> = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect to your MetaMask wallet',
      icon: '🦊',
      color: 'bg-orange-500',
      installUrl: 'https://metamask.io/download/',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect to your Coinbase wallet',
      icon: '�',
      color: 'bg-blue-600',
      installUrl: 'https://www.coinbase.com/wallet',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with WalletConnect',
      icon: '�',
      color: 'bg-blue-500',
    },
  ].sort((a, b) => {
    // Sort installed wallets to top
    const aInstalled = installedWallets.has(a.id);
    const bInstalled = installedWallets.has(b.id);
    
    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    return 0;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          <ModalTransition className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connect Wallet
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="p-6">
          {renderSecurityStatus()}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                  {error.includes('MetaMask is not installed') && (
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    >
                      Click here to install MetaMask
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {wallets.map((wallet) => {
              const isInstalled = installedWallets.has(wallet.id);
              
              if (isInstalled) {
                return (
                  <button
                    key={wallet.id}
                    onClick={() => connectWallet(wallet.id)}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`w-12 h-12 ${wallet.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {wallet.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {wallet.name}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ Installed
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {wallet.description}
                      </div>
                    </div>
                    {isConnecting && (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                );
              } else {
                return (
                  <div
                    key={wallet.id}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className={`w-12 h-12 ${wallet.color} rounded-lg flex items-center justify-center text-white text-xl opacity-60`}>
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
                    {wallet.installUrl && (
                      <a
                        href={wallet.installUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        Install
                      </a>
                    )}
                  </div>
                );
              }
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Enhanced Security Active</p>
                <p className="text-blue-700 dark:text-blue-300">
                  All connections are validated with domain verification, phishing protection, and security checks.
                </p>
              </div>
            </div>
          </div>
          </div>
        </ModalTransition>
      </div>
    </AnimatePresence>
  );
};
