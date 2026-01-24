'use client';

import React from 'react';
import { useTransactionStore } from '@/store/transactionStore';

const TransactionWatcher = ({ transaction }: { transaction: any }) => {
  const { updateTransaction } = useTransactionStore();

  // For demo purposes, we'll simulate transaction monitoring
  // In a real app, you'd use wagmi's useWaitForTransactionReceipt here
  React.useEffect(() => {
    if (transaction.status === 'pending') {
      // Simulate confirmation after 5 seconds for demo
      const timer = setTimeout(() => {
        updateTransaction(transaction.id, {
          status: 'confirmed',
          gasUsed: '21000',
          confirmations: 1,
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [transaction.id, transaction.status, updateTransaction]);

  return null;
};

export const TransactionMonitor = () => {
  const { pendingTransactions } = useTransactionStore();

  return (
    <>
      {pendingTransactions.map((transaction) => (
        <TransactionWatcher key={transaction.id} transaction={transaction} />
      ))}
    </>
  );
};