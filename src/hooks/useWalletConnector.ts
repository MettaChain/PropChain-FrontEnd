import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';

export type SupportedWalletId = 'metamask' | 'walletconnect' | 'coinbase';

export interface ConnectorResult {
  address: string;
  chainId: number;
}

/**
 * Hook for lazy-loading wallet connectors on demand
 * Dynamically imports connector modules only when a user initiates connection
 */
export const useWalletConnector = () => {
  const [isLoadingConnector, setIsLoadingConnector] = useState(false);
  const [connectorError, setConnectorError] = useState<string | null>(null);

  /**
   * Dynamically loads and executes the MetaMask connector
   */
  const connectMetaMask = useCallback(async (): Promise<ConnectorResult> => {
    try {
      setIsLoadingConnector(true);
      setConnectorError(null);

      logger.debug('Lazy-loading MetaMask connector...');

      // Dynamic import - loaded only when this function is called
      const { connectMetaMaskWallet } = await import('@/lib/walletConnectors/metamask');

      const result = await connectMetaMaskWallet();
      
      logger.debug('MetaMask connector loaded and executed successfully');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect MetaMask';
      setConnectorError(message);
      logger.error('MetaMask connector error:', error);
      throw error;
    } finally {
      setIsLoadingConnector(false);
    }
  }, []);

  /**
   * Dynamically loads and executes the Coinbase Wallet connector
   */
  const connectCoinbase = useCallback(async (): Promise<ConnectorResult> => {
    try {
      setIsLoadingConnector(true);
      setConnectorError(null);

      logger.debug('Lazy-loading Coinbase connector...');

      // Dynamic import - loaded only when this function is called
      const { connectCoinbaseWallet } = await import('@/lib/walletConnectors/coinbase');

      const result = await connectCoinbaseWallet();

      logger.debug('Coinbase connector loaded and executed successfully');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect Coinbase Wallet';
      setConnectorError(message);
      logger.error('Coinbase connector error:', error);
      throw error;
    } finally {
      setIsLoadingConnector(false);
    }
  }, []);

  /**
   * Dynamically loads and executes the WalletConnect connector
   */
  const connectWalletConnect = useCallback(async (): Promise<ConnectorResult> => {
    try {
      setIsLoadingConnector(true);
      setConnectorError(null);

      logger.debug('Lazy-loading WalletConnect connector...');

      // Dynamic import - loaded only when this function is called
      const { connectWalletConnectWallet } = await import('@/lib/walletConnectors/walletconnect');

      const result = await connectWalletConnectWallet();

      logger.debug('WalletConnect connector loaded and executed successfully');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect with WalletConnect';
      setConnectorError(message);
      logger.error('WalletConnect connector error:', error);
      throw error;
    } finally {
      setIsLoadingConnector(false);
    }
  }, []);

  /**
   * Unifies connector selection and lazy-loading
   */
  const connectWallet = useCallback(async (walletId: SupportedWalletId): Promise<ConnectorResult> => {
    switch (walletId) {
      case 'metamask':
        return connectMetaMask();
      case 'coinbase':
        return connectCoinbase();
      case 'walletconnect':
        return connectWalletConnect();
      default:
        throw new Error(`Unsupported wallet: ${walletId}`);
    }
  }, [connectMetaMask, connectCoinbase, connectWalletConnect]);

  const clearError = useCallback(() => {
    setConnectorError(null);
  }, []);

  return {
    connectWallet,
    connectMetaMask,
    connectCoinbase,
    connectWalletConnect,
    isLoadingConnector,
    connectorError,
    clearError,
  };
};
