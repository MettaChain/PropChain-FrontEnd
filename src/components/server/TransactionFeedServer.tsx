/**
 * Transaction Feed Server Component
 *
 * This component fetches and renders transaction data on the server,
 * improving initial load time and SEO.
 */

import { logger } from '@/utils/logger';

interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  chainId: number;
}

async function fetchTransactions(): Promise<Transaction[]> {
  try {
    // In production, this would fetch from an API or blockchain
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    logger.error('Failed to fetch transactions', error as Error);
    return [];
  }
}

function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export async function TransactionFeedServer() {
  const transactions = await fetchTransactions();

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Recent Transactions
      </h2>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="py-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatAddress(tx.from)}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatAddress(tx.to)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTimestamp(tx.timestamp)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {tx.value} ETH
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  tx.status
                )}`}
              >
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
