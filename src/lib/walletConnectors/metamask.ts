/**
 * MetaMask Wallet Connector - Lazy Loaded
 * This module is dynamically imported only when the user initiates MetaMask connection
 */

import { getErrorCode } from '@/utils/typeGuards';

export interface MetaMaskConnectorResult {
  address: string;
  chainId: number;
}

/**
 * Connects to MetaMask wallet
 * Handles account and chain ID requests
 */
export const connectMetaMaskWallet = async (): Promise<MetaMaskConnectorResult> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install the MetaMask extension to continue.');
  }

  if (!window.ethereum.isMetaMask) {
    throw new Error('MetaMask extension not detected. Please ensure MetaMask is installed and enabled.');
  }

  try {
    // Request user accounts
    const accounts = await window.ethereum.request<string[]>({
      method: 'eth_requestAccounts',
    });

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
    }

    const address = accounts[0];
    if (typeof address !== 'string') {
      throw new Error('Invalid account address received from MetaMask');
    }

    // Request current chain ID
    const chainId = await window.ethereum.request<string>({
      method: 'eth_chainId',
    });

    if (typeof chainId !== 'string') {
      throw new Error('Invalid chain ID received from MetaMask');
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
      throw new Error('MetaMask connection request is already pending. Please check your MetaMask extension.');
    }

    throw error;
  }
};

/**
 * Validate MetaMask installation
 */
export const isMetaMaskAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.ethereum && window.ethereum.isMetaMask);
};
