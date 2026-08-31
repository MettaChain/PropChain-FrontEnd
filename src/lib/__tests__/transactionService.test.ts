import { mapApiTransaction, transactionService, type ApiTransaction } from '@/lib/transactionService';

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

describe('transactionService.getTransactions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('requests the transactions endpoint with the URL-encoded wallet address', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const trickyAddress = '0xabc def/123';
    await transactionService.getTransactions(trickyAddress);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/transactions?walletAddress=${encodeURIComponent(trickyAddress)}`
    );
  });

  it('maps each returned API transaction into the store Transaction shape', async () => {
    const apiTxs: ApiTransaction[] = [
      { ...baseApiTx, id: 'tx-1' },
      { ...baseApiTx, id: 'tx-2', status: 'pending' },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => apiTxs,
    }) as unknown as typeof fetch;

    const result = await transactionService.getTransactions(walletAddress);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mapApiTransaction(apiTxs[0], walletAddress));
    expect(result[1].status).toBe('pending');
  });

  it('throws the server-provided error message when the response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Wallet not found' }),
    }) as unknown as typeof fetch;

    await expect(transactionService.getTransactions(walletAddress)).rejects.toThrow(
      'Wallet not found'
    );
  });

  it('falls back to a generic error message when the error response body is not valid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('invalid json');
      },
    }) as unknown as typeof fetch;

    await expect(transactionService.getTransactions(walletAddress)).rejects.toThrow(
      'Failed to fetch transactions'
    );
  });

  it('propagates a network failure thrown by fetch itself', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;

    await expect(transactionService.getTransactions(walletAddress)).rejects.toThrow(
      'Network down'
    );
  });
});
