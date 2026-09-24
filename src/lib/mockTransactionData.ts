import type { ApiTransaction } from '@/lib/transactionService';

/**
 * Mock transaction history returned by GET /api/transactions.
 * Shared by the API route and MSW test handlers.
 *
 * When a walletAddress is supplied, the returned ledger is deterministically
 * scoped to that address (rather than always returning the same fixed list
 * for every wallet) so two different addresses can be observed to behave
 * differently.
 */
export function getMockApiTransactions(walletAddress?: string): ApiTransaction[] {
  const allTransactions: ApiTransaction[] = [
    {
      id: 'tx-1',
      type: 'purchase',
      propertyId: '1',
      propertyName: 'Luxury Downtown Penthouse',
      amount: 10,
      totalCost: 1000,
      transactionHash: '0xabc123def4567890abcdef1234567890abcdef12',
      timestamp: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: 'tx-2',
      type: 'purchase',
      propertyId: '2',
      propertyName: 'Modern Office Complex',
      amount: 5,
      totalCost: 1000,
      transactionHash: '0xdef456abc7890123def456abc7890123def456ab',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    },
    {
      id: 'tx-3',
      type: 'transfer',
      propertyId: '1',
      propertyName: 'Luxury Downtown Penthouse',
      amount: 2,
      totalCost: 200,
      transactionHash: '0x789ghi012jkl3456mno789ghi012jkl3456mno78',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: 'completed',
    },
  ];

  if (!walletAddress) {
    return allTransactions;
  }

  const seed = Array.from(walletAddress).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const count = (seed % allTransactions.length) + 1;

  return allTransactions.slice(0, count);
}
