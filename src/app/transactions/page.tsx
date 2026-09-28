'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WalletConnector } from '@/components/WalletConnector';
import { History } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppHeader } from '@/components/layout/AppHeader';

function TransactionsContent() {
  const { t } = useTranslation('common');
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
      <AppHeader
        sticky
        backHref="/dashboard"
        backLabel={t('transactions.backToDashboard')}
        actions={<WalletConnector />}
      />

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
