'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WalletConnector } from '@/components/WalletConnector';
import { ArrowLeft, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

function TransactionsContent() {
  const { t } = useTranslation('common');
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">{t('transactions.backToDashboard')}</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PC</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PropChain</h1>
              </div>
            </div>
            <WalletConnector />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-8 h-8 text-blue-600" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('transactions.transactionHistory')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('transactions.pageDescription')}</p>
        </div>

        {!isConnected ? (
          <EmptyState
            title={t('transactions.connectWallet')}
            description={t('transactions.connectWalletDescription')}
            icon={History}
            action={{
              label: t('transactions.goToDashboard'),
              href: '/dashboard',
            }}
          />
        ) : (
          <TransactionHistory />
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return <TransactionsContent />;
}
