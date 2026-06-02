/**
 * WalletConnect Connector - Lazy Loaded
 * This module is dynamically imported only when the user initiates WalletConnect connection
 * Requires @walletconnect/web3-provider v2
 */

import { logger } from '@/utils/logger';

export interface WalletConnectConnectorResult {
  address: string;
  chainId: number;
}

/**
 * Connects via WalletConnect
 * Dynamically loads WalletConnect provider when needed
 */
export const connectWalletConnectWallet = async (): Promise<WalletConnectConnectorResult> => {
  try {
    // Dynamically import WalletConnect provider only when needed
    // This avoids loading the library immediately on app start
    const WalletConnectProvider = (await import('@walletconnect/web3-provider')).default;

    logger.debug('WalletConnect provider loaded');

    const provider = new WalletConnectProvider({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
      chains: [1, 137, 56], // Ethereum, Polygon, BSC
      rpcMap: {
        1: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.llamarpc.com',
        137: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com',
        56: process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.bnbchain.org',
      },
      showQrModal: true,
      metadata: {
        name: 'PropChain',
        description: 'Decentralized Real Estate Platform',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: [],
      },
    });

    // Enable the provider
    const accounts = await provider.enable();

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts returned from WalletConnect');
    }

    const address = accounts[0];
    if (typeof address !== 'string') {
      throw new Error('Invalid account address received from WalletConnect');
    }

    // Get chain ID
    const chainIdHex = await provider.request({
      method: 'eth_chainId',
      params: [],
    }) as string;

    const chainIdNumber = parseInt(chainIdHex, 16);

    logger.debug('WalletConnect connection successful', { address, chainId: chainIdNumber });

    return {
      address,
      chainId: chainIdNumber,
    };
  } catch (error: unknown) {
    logger.error('WalletConnect connection error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('User rejected') || error.message.includes('user_rejected')) {
        throw new Error('You rejected the WalletConnect request. Please try again.');
      }
      if (error.message.includes('project ID')) {
        throw new Error('WalletConnect is not properly configured. Please contact support.');
      }
    }

    throw new Error('Failed to connect with WalletConnect. Please try again.');
  }
};

/**
 * Check if WalletConnect is configured
 */
export const isWalletConnectConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID);
};
