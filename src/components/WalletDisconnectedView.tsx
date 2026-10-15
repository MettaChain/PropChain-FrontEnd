'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletStore } from '@/store/walletStore';
import { detectWalletExtensions } from '@/utils/extensionDetection';

const WalletModal = dynamic(
  () => import('./WalletModal').then((m) => m.WalletModal),
  { ssr: false },
);

/**
 * Displays the wallet's disconnected state including:
 * - Connect wallet button
 * - Wallet connection modal
 * - Empty-state guidance when no browser wallet extension is installed
 * - Error messages
 */
export function WalletDisconnectedView() {
  const { isConnecting, error } = useWalletStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Assume a wallet is present on the first render so server and client markup
  // match, then refine after mount once extension detection can run.
  const [hasBrowserWallet, setHasBrowserWallet] = useState(true);

  useEffect(() => {
    setHasBrowserWallet(detectWalletExtensions().some((ext) => ext.isInstalled));
  }, []);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={handleOpenModal}
        disabled={isConnecting}
        data-tour="wallet-connector"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <Skeleton className="w-4 h-4 rounded-full bg-white/40" />
            <Skeleton className="h-4 w-20 bg-white/40" />
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {!hasBrowserWallet && !isConnecting && (
        <p
          role="status"
          className="hidden lg:flex max-w-xs items-center gap-1 text-xs leading-snug text-gray-500 dark:text-gray-400"
        >
          No browser wallet detected.{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
          >
            Install a wallet
          </a>
          , or continue with WalletConnect.
        </p>
      )}

      <WalletModal isOpen={isModalOpen} onClose={handleCloseModal} />

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
}
