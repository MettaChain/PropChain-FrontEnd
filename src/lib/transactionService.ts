import type { Transaction, TransactionStatus, TransactionType } from '@/store/transactionStore';

export interface ApiTransaction {
  id: string;
  type: string;
  propertyId?: string;
  propertyName?: string;
  amount?: number;
  totalCost?: number;
  transactionHash: string;
  timestamp: string;
  status: string;
}

const TRANSACTION_TYPES: TransactionType[] = ['purchase', 'transfer', 'management', 'other'];

function mapApiStatus(status: string): TransactionStatus {
  const statusMap: Record<string, TransactionStatus> = {
    completed: 'confirmed',
    confirmed: 'confirmed',
    pending: 'pending',
    processing: 'processing',
    failed: 'failed',
    cancelled: 'cancelled',
  };
  return statusMap[status.toLowerCase()] ?? 'pending';
}

function mapApiType(type: string): TransactionType {
  return TRANSACTION_TYPES.includes(type as TransactionType)
    ? (type as TransactionType)
    : 'other';
}

export function mapApiTransaction(api: ApiTransaction, walletAddress: string): Transaction {
  return {
    id: api.id,
    hash: api.transactionHash,
    type: mapApiType(api.type),
    status: mapApiStatus(api.status),
    chainId: 1,
    from: walletAddress,
    value: String(api.totalCost ?? api.amount ?? 0),
    confirmations: 12,
    requiredConfirmations: 12,
    timestamp: new Date(api.timestamp).getTime(),
    description: api.propertyName,
    propertyId: api.propertyId,
  };
}

class TransactionService {
  async getTransactions(walletAddress: string): Promise<Transaction[]> {
    const response = await fetch(
      `/api/transactions?walletAddress=${encodeURIComponent(walletAddress)}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }));
      throw new Error(
        typeof error === 'object' && error && 'error' in error
          ? String((error as { error: string }).error)
          : 'Failed to fetch transactions'
      );
    }

    const data: ApiTransaction[] = await response.json();
    return data.map((tx) => mapApiTransaction(tx, walletAddress));
  }
}

export const transactionService = new TransactionService();
