import { blockchainSecurity } from '../blockchainSecurity';

jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('BlockchainSecurity - localhost address validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        riskLevel: 'low',
        riskScore: 10,
        sanctions: false,
        mixer: false,
        warnings: [],
      }),
    });
  });

  describe('checkAddressRisk', () => {
    it('returns risk data for a valid address', async () => {
      const result = await blockchainSecurity.checkAddressRisk('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('riskScore');
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('caches results for repeated address checks', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
      const first = await blockchainSecurity.checkAddressRisk(address);
      const second = await blockchainSecurity.checkAddressRisk(address);
      expect(first.riskLevel).toEqual(second.riskLevel);
    });

    it('falls back to simulated data when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const result = await blockchainSecurity.checkAddressRisk('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
      expect(result).toHaveProperty('riskLevel');
    });
  });

  describe('validateTransaction', () => {
    it('returns valid for a clean transaction', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          riskScore: 5,
          warnings: [],
          blocks: [],
          sanctioned: false,
        }),
      });
      const result = await blockchainSecurity.validateTransaction(
        '0xFrom',
        '0xTo',
        '1000000000000000000'
      );
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('riskScore');
    });

    it('handles hex value format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          riskScore: 5,
          warnings: [],
          blocks: [],
          sanctioned: false,
        }),
      });
      const result = await blockchainSecurity.validateTransaction(
        '0xFrom',
        '0xTo',
        '0x0de0b6b3a7640000'
      );
      expect(result).toHaveProperty('riskScore');
    });

    it('handles scientific notation value', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          riskScore: 5,
          warnings: [],
          blocks: [],
          sanctioned: false,
        }),
      });
      const result = await blockchainSecurity.validateTransaction(
        '0xFrom',
        '0xTo',
        '1e18'
      );
      expect(result).toHaveProperty('riskScore');
    });
  });
});
