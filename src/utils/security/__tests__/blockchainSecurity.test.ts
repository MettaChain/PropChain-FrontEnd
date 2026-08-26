import { BlockchainSecurityService, SecurityServiceConfig } from '../blockchainSecurity';

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

global.fetch = jest.fn();

const mockConfig: SecurityServiceConfig = {
  baseUrl: 'http://localhost:3000',
  timeout: 5000,
};

function createService() {
  (BlockchainSecurityService as any).instance = null;
  return BlockchainSecurityService.getInstance(mockConfig);
}

describe('BlockchainSecurityService', () => {
  let service: BlockchainSecurityService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    service = createService();
    service.clearCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkAddressRisk', () => {
    const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';

    it('returns risk data with level and score', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ risk_score: 30, categories: ['low_risk'], labels: ['monitor'], description: 'Clean' }),
      });

      const result = await service.checkAddressRisk(address);
      expect(result).toHaveProperty('address', address);
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskLevel');
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('caches results for 5 minutes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ risk_score: 20, categories: [], labels: [], description: '' }),
      });

      await service.checkAddressRisk(address);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const result2 = await service.checkAddressRisk(address);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result2.riskScore).toBe(20);

      jest.advanceTimersByTime(5 * 60 * 1000 - 1);
      await service.checkAddressRisk(address);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('uses simulated data when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.checkAddressRisk(address);
      expect(result).toHaveProperty('riskScore');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.categories).toBeDefined();
      expect(result.labels).toBeDefined();
    });

    it('uses simulated data when API returns non-ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.checkAddressRisk(address);
      expect(result).toHaveProperty('riskScore');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateTransaction', () => {
    const from = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
    const to = '0x1234567890123456789012345678901234567890';
    const value = '1000000000000000000';

    it('returns valid for clean transaction', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: ['low_risk'],
        labels: [],
        description: 'Clean',
      });

      const result = await service.validateTransaction(from, to, value);
      expect(result.isValid).toBe(true);
      expect(result.blocks).toHaveLength(0);
    });

    it('blocks sanctioned addresses', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['sanctions'],
        labels: [],
        description: 'Sanctioned',
      });

      const result = await service.validateTransaction(from, to, value);
      expect(result.isValid).toBe(false);
      expect(result.blocks).toContain('Sender address is on sanctions list');
      expect(result.blocks).toContain('Recipient address is on sanctions list');
    });

    it('warns about mixer interactions', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['mixer'],
        labels: [],
        description: 'Mixer associated',
      });

      const result = await service.validateTransaction(from, to, value);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Transaction involves mixer-associated address');
    });

    it('blocks critical risk addresses', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockImplementation(async (addr: string) => ({
        address: addr,
        riskScore: 90,
        riskLevel: 'critical' as const,
        categories: ['high_risk'],
        labels: [],
        description: 'Critical',
      }));

      const result = await service.validateTransaction(from, to, value);
      expect(result.isValid).toBe(false);
      expect(result.blocks).toContain('Sender address has critical risk level');
      expect(result.blocks).toContain('Recipient address has critical risk level');
    });

    it('handles hex value format', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: [],
        labels: [],
        description: '',
      });

      const result = await service.validateTransaction(from, to, '0x1');
      expect(result.isValid).toBe(true);
    });

    it('handles decimal wei value format', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: [],
        labels: [],
        description: '',
      });

      const result = await service.validateTransaction(from, to, '1000000000000000000');
      expect(result.isValid).toBe(true);
    });

    it('handles ether decimal value format', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: [],
        labels: [],
        description: '',
      });

      const result = await service.validateTransaction(from, to, '1.5');
      expect(result.isValid).toBe(true);
    });

    it('handles scientific notation value format', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: [],
        labels: [],
        description: '',
      });

      const result = await service.validateTransaction(from, to, '1e18');
      expect(result.isValid).toBe(true);
    });
  });

  describe('cache expiration', () => {
    it('cache entries expire after TTL', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ riskScore: 10, categories: [], labels: [], description: '' }),
      });

      await service.checkAddressRisk(address);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(5 * 60 * 1000 + 1);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ riskScore: 20, categories: [], labels: [], description: '' }),
      });

      await service.checkAddressRisk(address);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
