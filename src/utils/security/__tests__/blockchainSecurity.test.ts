import { BlockchainSecurityService, SecurityServiceConfig } from '../blockchainSecurity';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('BlockchainSecurityService', () => {
  let service: BlockchainSecurityService;
  const mockConfig: SecurityServiceConfig = {
    baseUrl: 'https://api.test.com',
    timeout: 5000,
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (BlockchainSecurityService as any).instance = null;
    service = BlockchainSecurityService.getInstance(mockConfig);
  });

  describe('getInstance', () => {
    it('should create a new instance when none exists', () => {
      const instance = BlockchainSecurityService.getInstance(mockConfig);
      expect(instance).toBeInstanceOf(BlockchainSecurityService);
    });

    it('should return existing instance on subsequent calls', () => {
      const instance1 = BlockchainSecurityService.getInstance(mockConfig);
      const instance2 = BlockchainSecurityService.getInstance(mockConfig);
      expect(instance1).toBe(instance2);
    });

    it('should throw error when no config provided for first call', () => {
      (BlockchainSecurityService as any).instance = null;
      expect(() => BlockchainSecurityService.getInstance()).toThrow(
        'Configuration required for first initialization'
      );
    });
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
        description: 'Address appears to have normal activity'
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
        description: 'Address appears to have normal activity'
      };

      // Set expired cache (5 minutes + 1 second ago)
      const expiredTime = Date.now() - (5 * 60 * 1000) - 1000;
      service['cache'].set(`address_${testAddress}`, {
        data: cachedResult,
        timestamp: expiredTime
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ risk_score: 50, categories: ['medium_risk'] })
      });

      const result = await service.checkAddressRisk(testAddress);
      expect(fetch).toHaveBeenCalled();
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should return default risk score on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await service.checkAddressRisk(testAddress);
      expect(result).toEqual({
        address: testAddress,
        riskScore: 50,
        riskLevel: 'medium',
        categories: ['unknown'],
        labels: ['unable_to_verify'],
        description: 'Unable to verify address risk due to service unavailability'
      });
    });

    it('should handle different risk score ranges correctly', async () => {
      // Mock different risk scores
      const testCases = [
        { score: 10, expectedLevel: 'low' },
        { score: 40, expectedLevel: 'medium' },
        { score: 60, expectedLevel: 'high' },
        { score: 85, expectedLevel: 'critical' }
      ];

      for (const { score, expectedLevel } of testCases) {
        // Mock the simulation to return specific score
        jest.spyOn(service as any, 'simulateAddressRiskCheck').mockResolvedValueOnce({
          score,
          categories: [`${expectedLevel}_risk`],
          labels: [],
          description: 'Test'
        });

        const result = await service.checkAddressRisk(testAddress);
        expect(result.riskLevel).toBe(expectedLevel);
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
        scam: false
      };

      service['cache'].set(`tx_${testHash}`, {
        data: cachedResult,
        timestamp: Date.now()
      });

      const result = await service.checkTransactionRisk(testHash);
      expect(result).toEqual(cachedResult);
    });

    it('should return default transaction risk on failure', async () => {
      jest.spyOn(service as any, 'simulateTransactionRiskCheck').mockRejectedValueOnce(new Error('Simulation failed'));

      const result = await service.checkTransactionRisk(testHash);
      expect(result).toEqual({
        hash: testHash,
        riskScore: 50,
        riskLevel: 'medium',
        alerts: ['Unable to verify transaction risk'],
        sanctions: false,
        mixer: false,
        gambling: false,
        scam: false
      });
    });

    it('should handle transaction with sanctions flag', async () => {
      jest.spyOn(service as any, 'simulateTransactionRiskCheck').mockResolvedValueOnce({
        score: 95,
        alerts: ['Transaction involves sanctioned address'],
        sanctions: true,
        mixer: false,
        gambling: false,
        scam: false
      });

      const result = await service.checkTransactionRisk(testHash);
      expect(result.sanctions).toBe(true);
      expect(result.alerts).toContain('Transaction involves sanctioned address');
      expect(result.riskLevel).toBe('critical');
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
        description: 'Sanctioned'
      });

      const result = await service.checkSanctions('0x123');
      expect(result).toBe(true);
    });

    it('should return false when address is not sanctioned', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValueOnce({
        address: '0x123',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['low_risk'],
        labels: [],
        description: 'Clean'
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
        description: 'Mixer'
      });

      const result = await service.checkMixer('0x123');
      expect(result).toBe(true);
    });

    it('should return false when address is not associated with mixer', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValueOnce({
        address: '0x123',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['low_risk'],
        labels: [],
        description: 'Clean'
      });

      const result = await service.checkMixer('0x123');
      expect(result).toBe(false);
    });
  });

  describe('getSecurityAlerts', () => {
    it('should return security alerts for address', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValueOnce({
        address: '0x123',
        riskScore: 80,
        riskLevel: 'high',
        categories: ['scam', 'mixer'],
        labels: ['suspicious'],
        description: 'High risk address'
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
  });

  describe('validateTransaction', () => {
    const fromAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
    const toAddress = '0x1234567890123456789012345678901234567890';
    const value = '1000000000000000000'; // 1 ETH

    it('should validate transaction successfully with low risk', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockImplementation(async (address) => ({
        address,
        riskScore: 10,
        riskLevel: 'low',
        categories: ['low_risk'],
        labels: [],
        description: 'Clean address'
      }));

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(true);
      expect(result.riskScore).toBe(10);
      expect(result.warnings).toHaveLength(0);
      expect(result.blocks).toHaveLength(0);
    });

    it('should block transaction with critical risk sender', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockImplementation(async (address) => ({
        address,
        riskScore: address === fromAddress ? 90 : 10,
        riskLevel: address === fromAddress ? 'critical' : 'low',
        categories: address === fromAddress ? ['high_risk'] : ['low_risk'],
        labels: [],
        description: address === fromAddress ? 'Critical risk' : 'Clean'
      }));

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(false);
      expect(result.blocks).toContain('Sender address has critical risk level');
    });

    it('should block transaction with sanctioned addresses', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['sanctions'],
        labels: [],
        description: 'Sanctioned'
      });

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(false);
      expect(result.blocks).toContain('Sender address is on sanctions list');
      expect(result.blocks).toContain('Recipient address is on sanctions list');
    });

    it('should warn about high-value transaction to risky address', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockImplementation(async (address) => ({
        address,
        riskScore: address === toAddress ? 60 : 10,
        riskLevel: address === toAddress ? 'high' : 'low',
        categories: address === toAddress ? ['high_risk'] : ['low_risk'],
        labels: [],
        description: address === toAddress ? 'Risky recipient' : 'Clean sender'
      }));

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('High-value transaction to risky address');
    });

    it('should warn about mixer involvement', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockResolvedValue({
        address: 'test',
        riskScore: 10,
        riskLevel: 'low',
        categories: ['mixer'],
        labels: [],
        description: 'Mixer'
      });

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Transaction involves mixer-associated address');
    });

    it('should handle validation errors gracefully', async () => {
      jest.spyOn(service, 'checkAddressRisk').mockRejectedValue(new Error('API Error'));

      const result = await service.validateTransaction(fromAddress, toAddress, value);
      expect(result.isValid).toBe(true); // Should not block on errors
      expect(result.warnings).toContain('Unable to complete security validation');
    });
  });

  describe('cache management', () => {
    it('should clear cache when clearCache is called', () => {
      service['cache'].set('test', { data: 'value', timestamp: Date.now() });
      expect(service['cache'].size).toBe(1);

      service.clearCache();
      expect(service['cache'].size).toBe(0);
    });

    it('should return correct cache statistics', () => {
      const now = Date.now();
      service['cache'].set('valid', { data: 'value', timestamp: now });
      service['cache'].set('expired', { data: 'value', timestamp: now - (6 * 60 * 1000) }); // 6 minutes ago

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1); // Only valid entry
      expect(stats.oldestEntry).toBe(now);
    });
  });

  describe('private methods', () => {
    describe('getRiskLevel', () => {
      it('should map risk scores to correct levels', () => {
        const testCases = [
          { score: 10, expected: 'low' },
          { score: 40, expected: 'medium' },
          { score: 60, expected: 'high' },
          { score: 80, expected: 'critical' }
        ];

        testCases.forEach(({ score, expected }) => {
          const result = (service as any).getRiskLevel(score);
          expect(result).toBe(expected);
        });
      });
    });

    describe('mapCategoryToAlertType', () => {
      it('should map categories to alert types', () => {
        const mappings = {
          'sanctions': 'sanctions',
          'scam': 'scam',
          'mixer': 'mixer',
          'gambling': 'gambling',
          'malware': 'malware',
          'exchange_hack': 'exchange_hack',
          'unknown': 'scam' // default
        };

        Object.entries(mappings).forEach(([category, expectedType]) => {
          const result = (service as any).mapCategoryToAlertType(category);
          expect(result).toBe(expectedType);
        });
      });
    });

    describe('getAlertSeverity', () => {
      it('should map risk levels to alert severities', () => {
        const mappings = {
          'critical': 'critical',
          'high': 'high',
          'medium': 'medium',
          'low': 'low'
        };

        Object.entries(mappings).forEach(([level, expectedSeverity]) => {
          const result = (service as any).getAlertSeverity(level);
          expect(result).toBe(expectedSeverity);
        });
      });
    });
  });
});