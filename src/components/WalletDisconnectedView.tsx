'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletStore } from '@/store/walletStore';

const WalletModal = dynamic(
  () => import('./WalletModal').then((m) => m.WalletModal),
  { ssr: false },
);

/**
 * Displays the wallet's disconnected state including:
 * - Connect wallet button
 * - Wallet connection modal
 * - Error messages
 */
export function WalletDisconnectedView() {
  const { isConnecting, error } = useWalletStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      <WalletModal isOpen={isModalOpen} onClose={handleCloseModal} />

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
}
