'use client';

import React, { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useChain } from '@/providers/ChainAwareProvider';
import { updateWalletBalance } from '@/utils/walletHelpers';
import { WalletConnectedView } from './WalletConnectedView';
import { WalletDisconnectedView } from './WalletDisconnectedView';
import { ErrorBoundary } from './ui/SimpleErrorBoundary';

/**
 * WalletConnector component that handles wallet connection UI, balance display,
 * network switching, and KYC status integration.
 *
 * Delegates the connected and disconnected UI states to dedicated sub-components
 * for better testability and separation of concerns.
 *
 * The whole wallet UI is wrapped in an error boundary so a failure inside one of
 * the views degrades to a retryable fallback instead of unmounting the layout
 * that hosts the connector.
 */
export const WalletConnector: React.FC = () => {
  const { isConnected, address, setBalance } = useWalletStore();
  const { currentChain } = useChain();

  // Fetch wallet balance when connected
  useEffect(() => {
    if (isConnected && address) {
      updateWalletBalance(window.ethereum, address, setBalance);
    }
  }, [isConnected, address, currentChain, setBalance]);

  return (
    <ErrorBoundary>
      {isConnected && address ? (
        <WalletConnectedView address={address} />
      ) : (
        <WalletDisconnectedView />
      )}
    </ErrorBoundary>
  );
};