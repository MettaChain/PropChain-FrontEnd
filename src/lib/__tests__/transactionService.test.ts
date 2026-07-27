import { mapApiTransaction, type ApiTransaction } from '@/lib/transactionService';

const walletAddress = '0x1234567890123456789012345678901234567890';

const baseApiTx: ApiTransaction = {
  id: 'tx-1',
  type: 'purchase',
  propertyId: '1',
  propertyName: 'Luxury Downtown Penthouse',
  amount: 10,
  totalCost: 1000,
  transactionHash: '0xabc123',
  timestamp: '2024-06-01T12:00:00.000Z',
  status: 'completed',
};

describe('mapApiTransaction', () => {
  it('maps API fields to store Transaction shape', () => {
    const result = mapApiTransaction(baseApiTx, walletAddress);

    expect(result.id).toBe('tx-1');
    expect(result.hash).toBe('0xabc123');
    expect(result.type).toBe('purchase');
    expect(result.status).toBe('confirmed');
    expect(result.from).toBe(walletAddress);
    expect(result.value).toBe('1000');
    expect(result.description).toBe('Luxury Downtown Penthouse');
    expect(result.propertyId).toBe('1');
    expect(result.timestamp).toBe(new Date('2024-06-01T12:00:00.000Z').getTime());
  });

  it('maps completed status to confirmed', () => {
    expect(mapApiTransaction({ ...baseApiTx, status: 'completed' }, walletAddress).status).toBe(
      'confirmed'
    );
  });

  it('maps unknown types to other', () => {
    expect(mapApiTransaction({ ...baseApiTx, type: 'unknown' }, walletAddress).type).toBe('other');
  });

  it('falls back to amount when totalCost is missing', () => {
    const { totalCost: _, ...withoutTotal } = baseApiTx;
    expect(mapApiTransaction({ ...withoutTotal, amount: 42 }, walletAddress).value).toBe('42');
  });
});
