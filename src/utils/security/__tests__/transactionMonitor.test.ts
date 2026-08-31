import { TransactionMonitor } from '../transactionMonitor';

// Mock the canonical logger to avoid pulling in the logger → walletStore → chains graph.
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TransactionMonitor (honest recipient checks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TransactionMonitor as any).instance = null;
  });

  it('no longer exposes the placeholder isSuspiciousAddress check', () => {
    expect((TransactionMonitor.prototype as any).isSuspiciousAddress).toBeUndefined();
  });

  it('does not fabricate a "flagged in security database" recipient anomaly', () => {
    const monitor = TransactionMonitor.getInstance();
    const wallet = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
    const now = Date.now();

    for (let i = 0; i < 8; i++) {
      monitor.addTransaction(wallet, {
        hash: `0x${i.toString(16)}`,
        to: `0x000000000000000000000000000000000000000${i}`,
        value: '1',
        timestamp: now - 1000 * (8 - i),
      });
    }

    const anomalies = monitor.getWalletAnomalies(wallet);
    const fabricated = anomalies.filter(
      (a) => a.details && a.details.reason === 'Address flagged in security database'
    );
    expect(fabricated).toHaveLength(0);
  });

  it('still records transactions and produces metrics', () => {
    const monitor = TransactionMonitor.getInstance();
    const wallet = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';

    monitor.addTransaction(wallet, {
      hash: '0x1',
      to: '0xabc',
      value: '0',
      timestamp: Date.now(),
    });

    expect(monitor.getWalletMetrics(wallet)).not.toBeNull();
  });
});
