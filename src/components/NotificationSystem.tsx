'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction } from '@/store/transactionStore';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export const NotificationSystem: React.FC = () => {
  const { transactions } = useTransactionStore();

  useEffect(() => {
    const handleTransactionUpdate = (transaction: Transaction) => {
      const { status, type, hash, description } = transaction;

      const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Transaction`;
      const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

      switch (status) {
        case 'confirmed':
          toast.success(`${title} Confirmed`, {
            description: `${description || 'Transaction'} ${shortHash} has been confirmed`,
            icon: <CheckCircle className="h-4 w-4" />,
            duration: 5000,
          });

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${title} Confirmed`, {
              body: `${description || 'Transaction'} ${shortHash} has been confirmed`,
              icon: '/favicon.ico',
            });
          }
          break;

        case 'failed':
          toast.error(`${title} Failed`, {
            description: `${description || 'Transaction'} ${shortHash} has failed`,
            icon: <XCircle className="h-4 w-4" />,
            duration: 7000,
          });

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${title} Failed`, {
              body: `${description || 'Transaction'} ${shortHash} has failed`,
              icon: '/favicon.ico',
            });
          }
          break;

        case 'processing':
          toast.info(`${title} Processing`, {
            description: `${description || 'Transaction'} ${shortHash} is being processed`,
            icon: <AlertCircle className="h-4 w-4" />,
            duration: 3000,
          });
          break;

        case 'cancelled':
          toast.warning(`${title} Cancelled`, {
            description: `${description || 'Transaction'} ${shortHash} has been cancelled`,
            icon: <Clock className="h-4 w-4" />,
            duration: 5000,
          });
          break;

        default:
          break;
      }
    };

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Monitor transaction changes
    transactions.forEach((transaction) => {
      // This is a simplified approach. In a real app, you'd track previous states
      // For now, we'll show notifications for all transactions with final states
      if (transaction.status === 'confirmed' || transaction.status === 'failed' || transaction.status === 'cancelled') {
        // Check if we haven't notified about this transaction yet
        const notifiedKey = `notified_${transaction.id}`;
        if (!localStorage.getItem(notifiedKey)) {
          handleTransactionUpdate(transaction);
          localStorage.setItem(notifiedKey, 'true');
        }
      }
    });
  }, [transactions]);

  return null;
};
