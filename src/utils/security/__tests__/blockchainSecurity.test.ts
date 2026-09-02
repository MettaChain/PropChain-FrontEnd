import { BlockchainSecurityService, SecurityServiceConfig } from '../blockchainSecurity';

// Mock the canonical logger so importing blockchainSecurity does not pull in the
// logger → csrfClient → walletStore → chains module graph (which needs browser globals).
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch for API calls
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
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';

    it('should return cached result when available and not expired', async () => {
      const cachedResult = {
        address: testAddress,
        riskScore: 25,
        riskLevel: 'low' as const,
        categories: ['low_risk'],
        labels: ['monitor'],
        description: 'Address appears to have normal activity',
        verified: true
      };

      // Manually set cache
      service['cache'].set(`address_${testAddress}`, {
        data: cachedResult,
        timestamp: Date.now()
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(result).toEqual(cachedResult);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch new data when cache is expired', async () => {
      const cachedResult = {
        address: testAddress,
        riskScore: 25,
        riskLevel: 'low' as const,
        categories: ['low_risk'],
        labels: ['monitor'],
        description: 'Address appears to have normal activity',
        verified: true
      };

      // Set expired cache (5 minutes + 1 second ago)
      const expiredTime = Date.now() - (5 * 60 * 1000) - 1000;
      service['cache'].set(`address_${testAddress}`, {
        data: cachedResult,
        timestamp: expiredTime
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ risk_score: 60, categories: ['high_risk'] })
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(fetch).toHaveBeenCalled();
      expect(result.riskScore).toBe(60);
    });

    it('returns risk data with level and score', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        /** Mock proxy JSON response with a verified numeric score. */
        json: async () => ({ risk_score: 50, categories: ['medium_risk'] })
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(fetch).toHaveBeenCalled();
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.verified).toBe(true);
    });

    it('caches results for 5 minutes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        /** Mock proxy JSON response with a verified numeric score. */
        json: async () => ({ risk_score: 30, categories: ['low_risk'], labels: [], description: 'Normal' })
      });

      await service.checkAddressRisk(testAddress);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      await service.checkAddressRisk(testAddress);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return an unverified result when proxy returns non-ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        /** Mock proxy JSON error response. */
        json: async () => ({ error: 'Bad gateway' })
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(result.verified).toBe(false);
      expect(result.categories).toEqual(['unknown']);
      expect(result.labels).toEqual(['unable_to_verify']);
    });

    it('should return an unverified result when proxy response has no numeric score', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        /** Mock proxy JSON response missing a numeric score. */
        json: async () => ({ categories: ['low_risk'] })
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(result.verified).toBe(false);
      expect(result.categories).toEqual(['unknown']);
    });

    it('should return an unverified result when proxy explicitly reports verified:false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        /** Mock proxy JSON response explicitly reporting unverified. */
        json: async () => ({ risk_score: 10, verified: false })
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(result.verified).toBe(false);
    });

    it('uses simulated data when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.checkAddressRisk(testAddress);
      expect(result).toEqual({
        address: testAddress,
        riskScore: 50,
        riskLevel: 'medium',
        categories: ['unknown'],
        labels: ['unable_to_verify'],
        description: 'Unable to verify address risk due to service unavailability',
        verified: false
      });
    });

    it('should map proxy risk scores to risk levels and mark verified', async () => {
      // Mock different risk scores
      const testCases = [
        { score: 10, expectedLevel: 'low' },
        { score: 40, expectedLevel: 'medium' },
        { score: 60, expectedLevel: 'high' },
        { score: 85, expectedLevel: 'critical' }
      ];

      for (const { score, expectedLevel } of testCases) {
        // Clear cache and mock the proxy to return specific score
        service.clearCache();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          /** Mock proxy JSON response with a verified score for the test case. */
          json: async () => ({ risk_score: score, categories: [`${expectedLevel}_risk`] })
        });

        const result = await service.checkAddressRisk(testAddress);
        expect(result.riskLevel).toBe(expectedLevel);
        expect(result.verified).toBe(true);
      }
    });
  });

  describe('checkTransactionRisk', () => {
    const testHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    it('should return cached transaction risk when available', async () => {
      const cachedResult = {
        hash: testHash,
        riskScore: 30,
        riskLevel: 'medium' as const,
        alerts: ['Test alert'],
        sanctions: false,
        mixer: false,
        gambling: false,
        scam: false,
        verified: true
      };

      service['cache'].set(`tx_${testHash}`, {
        data: cachedResult,
        timestamp: Date.now()
      });

      const result = await service.checkTransactionRisk(testHash);
      expect(result).toEqual(cachedResult);
    });

    it('should return an unverified default (no fabricated score from the hash)', async () => {
      const result = await service.checkTransactionRisk(testHash);
      expect(result).toEqual({
        hash: testHash,
        riskScore: 50,
        riskLevel: 'medium',
        alerts: ['Unable to verify transaction risk'],
        sanctions: false,
        mixer: false,
        gambling: false,
        scam: false,
        verified: false
      });
    });
  });

  describe('checkSanctions', () => {
    it('should return true when address is sanctioned', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValueOnce({
        address: '0x123',
        riskScore: 90,
        riskLevel: 'critical',
        categories: ['sanctions'],
        labels: [],
        description: 'Sanctioned',
        verified: true
      });

      const result = await service.checkSanctions('0x123');
      expect(result).toBe(true);
    });

    it('returns valid for clean transaction', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: ['low_risk'],
        labels: [],
        description: 'Clean',
        verified: true
      });

      const result = await service.checkSanctions('0x123');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockRejectedValueOnce(new Error('API Error'));

      const result = await service.checkSanctions('0x123');
      expect(result).toBe(false);
    });
  });

  describe('checkMixer', () => {
    it('should return true when address is associated with mixer', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValueOnce({
        address: '0x123',
        riskScore: 70,
        riskLevel: 'high',
        categories: ['mixer'],
        labels: [],
        description: 'Mixer',
        verified: true
      });

      const result = await service.checkMixer('0x123');
      expect(result).toBe(true);
    });

    it('blocks sanctioned addresses', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['sanctions'],
        labels: [],
        description: 'Clean',
        verified: true
      });

      const result = await service.checkMixer('0x123');
      expect(result).toBe(false);
    });
  });

  describe('getSecurityAlerts', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
    const from = '0x0000000000000000000000000000000000000001';
    const to = '0x0000000000000000000000000000000000000002';
    const fromAddress = from;
    const toAddress = to;
    const value = '1000000000000000000';

    it('should return security alerts for address', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValueOnce({
        address: '0x123',
        riskScore: 80,
        riskLevel: 'high',
        categories: ['scam', 'mixer'],
        labels: ['suspicious'],
        description: 'High risk address',
        verified: true
      });

      const alerts = await service.getSecurityAlerts('0x123');
      expect(alerts).toHaveLength(2);
      expect(alerts[0].type).toBe('scam');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[1].type).toBe('mixer');
    });

    it('should return empty array on error', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockRejectedValueOnce(new Error('API Error'));

      const alerts = await service.getSecurityAlerts('0x123');
      expect(alerts).toEqual([]);
    });

    it('warns about mixer interactions', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['mixer'],
        labels: [],
        description: 'Clean address',
        verified: true
      });

      const result = await service.validateTransaction(from, to, value);
      expect(result.isValid).toBe(true);
      expect(result.riskScore).toBe(10);
      expect(result.warnings).toContain('Transaction involves mixer-associated address');
      expect(result.blocks).toHaveLength(0);
      expect(result.verified).toBe(true);
    });

    it('should report verified:false when screening did not run', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockImplementation(async (address) => ({
        address,
        riskScore: 50,
        riskLevel: 'medium',
        categories: ['unknown'],
        labels: ['unable_to_verify'],
        description: 'Unable to verify address risk due to service unavailability',
        verified: false
      }));

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.verified).toBe(false);
    });

    it('blocks critical risk addresses', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockImplementation(async (addr: string) => ({
        address: addr,
        riskScore: 90,
        riskLevel: 'critical' as const,
        categories: ['high_risk'],
        labels: [],
        description: addr === fromAddress ? 'Critical risk' : 'Clean',
        verified: true
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
        description: 'Sanctioned',
        verified: true
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
        description: 'Normal',
        verified: true
      });

      // Value must exceed the 1 ETH threshold for the high-value warning to fire.
      const highValue = '2000000000000000000'; // 2 ETH
      const result = await service.validateTransaction(fromAddress, toAddress, highValue);
      expect(result.isValid).toBe(true);
    });

    it('handles ether decimal value format', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 5,
        riskLevel: 'low',
        categories: [],
        labels: [],
        description: 'Mixer',
        verified: true
      });

      const result = await service.validateTransaction(from, to, '1.5');
      expect(result.isValid).toBe(true);
    });

    it('should handle validation errors gracefully and report unverified', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockRejectedValue(new Error('API Error'));

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(true); // Should not block on errors
      expect(result.warnings).toContain('Unable to complete security validation');
      expect(result.verified).toBe(false);
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

    describe('no simulated checks remain', () => {
      it('does not expose simulateAddressRiskCheck or simulateTransactionRiskCheck', () => {
        expect((service as any).simulateAddressRiskCheck).toBeUndefined();
        expect((service as any).simulateTransactionRiskCheck).toBeUndefined();
      });
    });
  });
});
