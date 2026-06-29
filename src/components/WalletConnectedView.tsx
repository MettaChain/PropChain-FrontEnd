'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { KycStatusBadge } from '@/components/kyc/KycStatusBadge';
import { formatAddress, formatBalanceForDisplay, disconnectWallet } from '@/utils/walletHelpers';
import { useWalletStore } from '@/store/walletStore';
import { useChain } from '@/providers/ChainAwareProvider';
import { useKycStore } from '@/store/kycStore';

const NetworkSwitcher = dynamic(
  () => import('./NetworkSwitcher').then((m) => m.NetworkSwitcher),
  { ssr: false },
);

// ============================================================================
// Sub-component: CopyButton
// ============================================================================

interface CopyButtonProps {
  address: string;
}

function CopyButton({ address }: CopyButtonProps) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address);
  }, [address]);

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
      title="Copy wallet address"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
}

// ============================================================================
// Main component
// ============================================================================

interface WalletConnectedViewProps {
  address: string;
}

/**
 * Displays the wallet's connected state including:
 * - Network switcher
 * - Chain balance display
 * - Truncated address with copy button
 * - KYC status badge
 * - Disconnect button
 * - Error messages
 */
const WalletConnectedViewInner: React.FC<WalletConnectedViewProps> = ({ address }) => {
  const { setDisconnected, clearError, balance, error } = useWalletStore();
  const { chainConfig } = useChain();
  const { profile } = useKycStore();

  const handleDisconnect = useCallback(() => {
    disconnectWallet(setDisconnected, clearError);
  }, [setDisconnected, clearError]);

  const balanceText = balance ? formatBalanceForDisplay(balance) : null;

  return (
    <div className="flex items-center gap-3">
      <NetworkSwitcher />

      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: chainConfig.color }}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {chainConfig.symbol}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {balanceText ?? (
            <Skeleton className="h-4 w-10 inline-block align-middle" />
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 rounded-lg px-3 py-2">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {formatAddress(address)}
        </span>
        <CopyButton address={address} />
      </div>

      <KycStatusBadge status={profile.status} thresholdEth={profile.thresholdEth} compact />

      <button
        onClick={handleDisconnect}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
      >
        Disconnect
      </button>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
};

export const WalletConnectedView = React.memo(WalletConnectedViewInner);
