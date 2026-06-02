/**
 * Coinbase Wallet Connector - Lazy Loaded
 * This module is dynamically imported only when the user initiates Coinbase connection
 */

import { getErrorCode } from '@/utils/typeGuards';

export interface CoinbaseConnectorResult {
  address: string;
  chainId: number;
}

/**
 * Connects to Coinbase Wallet
 * Handles account and chain ID requests through MetaMask-compatible provider
 */
export const connectCoinbaseWallet = async (): Promise<CoinbaseConnectorResult> => {
  if (!window.ethereum) {
    throw new Error('Coinbase Wallet is not installed. Please install the Coinbase Wallet extension or app to continue.');
  }

  if (!window.ethereum.isCoinbaseWallet) {
    throw new Error('Coinbase Wallet extension not detected. Please ensure Coinbase Wallet is installed and enabled.');
  }

  try {
    // Request user accounts
    const accounts = await window.ethereum.request<string[]>({
      method: 'eth_requestAccounts',
    });

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts returned from Coinbase Wallet');
    }

    const address = accounts[0];
    if (typeof address !== 'string') {
      throw new Error('Invalid account address received from Coinbase Wallet');
    }

    // Request current chain ID
    const chainId = await window.ethereum.request<string>({
      method: 'eth_chainId',
    });

    if (typeof chainId !== 'string') {
      throw new Error('Invalid chain ID received from Coinbase Wallet');
    }

    const chainIdNumber = parseInt(chainId, 16);

    return {
      address,
      chainId: chainIdNumber,
    };
  } catch (error: unknown) {
    // Handle user rejection
    if (getErrorCode(error) === 4001) {
      throw new Error('You rejected the connection request. Please try again.');
    }

    // Handle already pending or other provider errors
    if (getErrorCode(error) === -32002) {
      throw new Error('Coinbase Wallet connection request is already pending. Please check your Coinbase Wallet.');
    }

    throw error;
  }
};

/**
 * Validate Coinbase Wallet installation
 */
export const isCoinbaseAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.ethereum && window.ethereum.isCoinbaseWallet);
};
