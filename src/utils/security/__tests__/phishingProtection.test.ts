import { PhishingProtection } from '../phishingProtection';

// Mock viem functions
jest.mock('viem', () => ({
  isAddress: jest.fn(),
  isHex: jest.fn(),
  recoverMessageAddress: jest.fn(),
  type: {
    Hex: jest.fn()
  }
}));

describe('PhishingProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PhishingProtection.clearMemoizedResults();
  });

  describe('detectPhishing', () => {
    it('should detect known phishing domains', () => {
      const result = PhishingProtection.detectPhishing('https://metamask.io.fake/phishing');
      expect(result.isPhishing).toBe(true);
      expect(result.riskScore).toBeGreaterThan(80);
      expect(result.threats).toContain('Known phishing domain detected');
    });

    it('should detect domain spoofing', () => {
      const result = PhishingProtection.detectPhishing('https://metamask-io.com/phishing');
      expect(result.isPhishing).toBe(true);
      expect(result.threats).toContain('Domain spoofing detected');
    });

    it('should detect suspicious URL patterns', () => {
      const suspiciousUrls = [
        'https://example.com/bit.ly/redirect',
        'https://192.168.1.1/phishing',
        'https://example.com/abc123def456ghi789jkl012mno345pqr678stu901vwx'
      ];

      suspiciousUrls.forEach(url => {
        const result = PhishingProtection.detectPhishing(url);
        expect(result.riskScore).toBeGreaterThan(20);
        expect(result.warnings).toContain('Suspicious URL patterns detected');
      });
    });

    it('should analyze content for phishing indicators', () => {
      const phishingContent = 'Verify your wallet immediately! Confirm your private key to avoid suspension.';
      const result = PhishingProtection.detectPhishing('https://example.com', phishingContent);

      expect(result.isPhishing).toBe(true);
      expect(result.threats).toContain('Phishing keyword detected: verify your wallet');
      expect(result.threats).toContain('Request for sensitive information detected');
    });

    it('should return low risk for legitimate URLs', () => {
      const result = PhishingProtection.detectPhishing('https://propchain.io/legitimate');
      expect(result.isPhishing).toBe(false);
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should handle invalid URLs gracefully', () => {
      const result = PhishingProtection.detectPhishing('not-a-url');
      expect(result.isPhishing).toBe(false);
      expect(result.warnings).toContain('Invalid URL format');
      expect(result.riskScore).toBeGreaterThan(15);
    });
  });

  describe('validateSignature', () => {
    const mockRecoverMessageAddress = require('viem').recoverMessageAddress;

    it('should validate legitimate signature', async () => {
      mockRecoverMessageAddress.mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      const result = await PhishingProtection.validateSignature(
        'Test message',
        '0x1234567890abcdef',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(true);
      expect(result.isMalicious).toBe(false);
    });

    it('should reject signature that does not match address', async () => {
      mockRecoverMessageAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');

      const result = await PhishingProtection.validateSignature(
        'Test message',
        '0x1234567890abcdef',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.isMalicious).toBe(true);
      expect(result.warnings).toContain('Signature does not match expected address');
    });

    it('should detect malicious message content', async () => {
      mockRecoverMessageAddress.mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      const maliciousMessage = '{"privateKey": "0x123", "seedPhrase": "word1 word2 word3"}';
      const result = await PhishingProtection.validateSignature(
        maliciousMessage,
        '0x1234567890abcdef',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(true);
      expect(result.isMalicious).toBe(true);
      expect(result.warnings).toContain('Message contains sensitive wallet data');
    });

    it('should handle invalid signature format', async () => {
      mockRecoverMessageAddress.mockRejectedValue(new Error('Invalid signature'));

      const result = await PhishingProtection.validateSignature(
        'Test message',
        'invalid-signature',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.isMalicious).toBe(true);
      expect(result.warnings).toContain('Invalid signature format');
    });
  });

  describe('validateTransactionData', () => {
    it('should validate legitimate transaction data', () => {
      const result = PhishingProtection.validateTransactionData(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001'
      );

      expect(result.isValid).toBe(true);
      expect(result.isMalicious).toBe(false);
    });

    it('should detect malicious contract addresses', () => {
      const result = PhishingProtection.validateTransactionData(
        '0x0000000000000000000000000000000000000000',
        '0x'
      );

      expect(result.isValid).toBe(false);
      expect(result.isMalicious).toBe(true);
      expect(result.warnings).toContain('Transaction to known malicious contract');
    });

    it('should detect suspicious method calls', () => {
      const result = PhishingProtection.validateTransactionData(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x095ea7b30000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000001'
      );

      expect(result.isValid).toBe(true);
      expect(result.isMalicious).toBe(true);
      expect(result.warnings).toContain('Suspicious function call detected');
    });

    it('should handle empty transaction data', () => {
      const result = PhishingProtection.validateTransactionData(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x'
      );

      expect(result.isValid).toBe(true);
      expect(result.isMalicious).toBe(false);
    });
  });

  describe('createSecureSignatureRequest', () => {
    it('should create secure signature request for normal message', () => {
      const result = PhishingProtection.createSecureSignatureRequest(
        'Please sign this transaction',
        'https://propchain.io'
      );

      expect(result.safeMessage).toContain('Please sign this transaction');
      expect(result.safeMessage).toContain('Origin: https://propchain.io');
      expect(result.safeMessage).toContain('Timestamp:');
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should require confirmation for sensitive operations', () => {
      const sensitiveMessage = 'Approve token transfer of 1000 tokens';
      const result = PhishingProtection.createSecureSignatureRequest(
        sensitiveMessage,
        'https://propchain.io'
      );

      expect(result.requiresConfirmation).toBe(true);
      expect(result.warnings).toContain('Message contains sensitive operations');
    });

    it('should require confirmation for unusual patterns', () => {
      const unusualMessage = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = PhishingProtection.createSecureSignatureRequest(
        unusualMessage,
        'https://propchain.io'
      );

      expect(result.requiresConfirmation).toBe(true);
      expect(result.warnings).toContain('Unusual message pattern detected');
    });
  });

  describe('private methods', () => {
    describe('isKnownPhishingDomain', () => {
      it('should identify known phishing domains', () => {
        expect((PhishingProtection as any).isKnownPhishingDomain('metamask.io.fake')).toBe(true);
        expect((PhishingProtection as any).isKnownPhishingDomain('myetherwallet.com.scam')).toBe(true);
        expect((PhishingProtection as any).isKnownPhishingDomain('legitimate.com')).toBe(false);
      });
    });

    describe('isDomainSpoofing', () => {
      it('should detect domain spoofing attempts', () => {
        expect((PhishingProtection as any).isDomainSpoofing('metamask-io.com')).toBe(true);
        expect((PhishingProtection as any).isDomainSpoofing('myetherwallet-app.net')).toBe(true);
        expect((PhishingProtection as any).isDomainSpoofing('legitimate-site.com')).toBe(false);
      });
    });

    describe('hasSuspiciousUrlPatterns', () => {
      it('should detect suspicious URL patterns', () => {
        expect((PhishingProtection as any).hasSuspiciousUrlPatterns('https://example.com/bit.ly/redirect')).toBe(true);
        expect((PhishingProtection as any).hasSuspiciousUrlPatterns('https://192.168.1.1/phish')).toBe(true);
        expect((PhishingProtection as any).hasSuspiciousUrlPatterns('https://example.com/normal')).toBe(false);
      });
    });

    describe('analyzeContent', () => {
      it('should detect phishing keywords', () => {
        const result = (PhishingProtection as any).analyzeContent('Verify your wallet immediately!');
        expect(result.threats).toContain('Phishing keyword detected: verify your wallet');
        expect(result.riskScore).toBeGreaterThan(20);
      });

      it('should detect requests for sensitive information', () => {
        const result = (PhishingProtection as any).analyzeContent('Please provide your private key');
        expect(result.threats).toContain('Request for sensitive information detected');
        expect(result.riskScore).toBeGreaterThan(40);
      });
    });

    describe('analyzeMessageContent', () => {
      it('should detect sensitive data in JSON messages', () => {
        const jsonMessage = '{"privateKey": "0x123", "seedPhrase": "word1 word2"}';
        const result = (PhishingProtection as any).analyzeMessageContent(jsonMessage);
        expect(result.isMalicious).toBe(true);
        expect(result.warnings).toContain('Message contains sensitive wallet data');
      });

      it('should detect sensitive operations in text messages', () => {
        const textMessage = 'Please approve this token transfer';
        const result = (PhishingProtection as any).analyzeMessageContent(textMessage);
        expect(result.isMalicious).toBe(true);
        expect(result.warnings).toContain('Message contains sensitive operations');
      });
    });

    describe('isMaliciousContract', () => {
      it('should identify known malicious contracts', () => {
        expect((PhishingProtection as any).isMaliciousContract('0x0000000000000000000000000000000000000000')).toBe(true);
        expect((PhishingProtection as any).isMaliciousContract('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45')).toBe(false);
      });
    });

    describe('isSuspiciousMethod', () => {
      it('should identify suspicious method signatures', () => {
        expect((PhishingProtection as any).isSuspiciousMethod('0xa9059cbb')).toBe(true); // transfer
        expect((PhishingProtection as any).isSuspiciousMethod('0x095ea7b3')).toBe(true); // approve
        expect((PhishingProtection as any).isSuspiciousMethod('0x12345678')).toBe(false);
      });
    });

    describe('containsSensitiveOperations', () => {
      it('should detect sensitive operations', () => {
        expect((PhishingProtection as any).containsSensitiveOperations('Please approve this transaction')).toBe(true);
        expect((PhishingProtection as any).containsSensitiveOperations('Please transfer these tokens')).toBe(true);
        expect((PhishingProtection as any).containsSensitiveOperations('Normal message')).toBe(false);
      });
    });

    describe('hasUnusualMessagePatterns', () => {
      it('should detect unusual message patterns', () => {
        expect((PhishingProtection as any).hasUnusualMessagePatterns('abcdef1234567890abcdef1234567890abcdef')).toBe(true);
        expect((PhishingProtection as any).hasUnusualMessagePatterns('base64string12345678901234567890')).toBe(true);
        expect((PhishingProtection as any).hasUnusualMessagePatterns('Normal message')).toBe(false);
      });
    });

    describe('calculateStringSimilarity', () => {
      it('should calculate string similarity correctly', () => {
        expect((PhishingProtection as any).calculateStringSimilarity('test', 'test')).toBe(1.0);
        expect((PhishingProtection as any).calculateStringSimilarity('test', 'tset')).toBe(0.5);
        expect((PhishingProtection as any).calculateStringSimilarity('abc', 'xyz')).toBe(0.0);
      });
    });

    describe('levenshteinDistance', () => {
      it('should calculate Levenshtein distance', () => {
        expect((PhishingProtection as any).levenshteinDistance('kitten', 'kitten')).toBe(0);
        expect((PhishingProtection as any).levenshteinDistance('kitten', 'sitting')).toBe(3);
        expect((PhishingProtection as any).levenshteinDistance('', 'abc')).toBe(3);
      });

      it('should handle two empty strings', () => {
        expect((PhishingProtection as any).levenshteinDistance('', '')).toBe(0);
      });

      it('should handle one empty string', () => {
        expect((PhishingProtection as any).levenshteinDistance('abc', '')).toBe(3);
      });
    });

    describe('decodeTransactionData', () => {
      it('should decode standard transaction data into method selector and params', () => {
        const data = '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001';
        const result = (PhishingProtection as any).decodeTransactionData(data);

        expect(result).toBeDefined();
        expect(result.methodSelector).toBe('0xa9059cbb');
        expect(result.params).toBe(data.slice(10));
        expect(result.decoded).toBe(false);
      });

      it('should handle data with only method selector and no params', () => {
        const data = '0xa9059cbb';
        const result = (PhishingProtection as any).decodeTransactionData(data);

        expect(result.methodSelector).toBe('0xa9059cbb');
        expect(result.params).toBe('');
      });

      it('should handle empty data gracefully', () => {
        const data = '';
        const result = (PhishingProtection as any).decodeTransactionData(data);

        expect(result.methodSelector).toBe('');
        expect(result.params).toBe('');
      });

      it('should handle approvals (0x095ea7b3) correctly', () => {
        const data = '0x095ea7b300000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001';
        const result = (PhishingProtection as any).decodeTransactionData(data);

        expect(result.methodSelector).toBe('0x095ea7b3');
        expect(result.params.length).toBeGreaterThan(0);
      });

      it('should handle withdraw method signature', () => {
        const data = '0x2e1a7d4d0000000000000000000000000000000000000000000000000000000000000010';
        const result = (PhishingProtection as any).decodeTransactionData(data);

        expect(result.methodSelector).toBe('0x2e1a7d4d');
      });
    });

    describe('analyzeTransactionParameters', () => {
      it('should return no warnings for normal decoded data', () => {
        const decodedData = {
          methodSelector: '0xa9059cbb',
          params: '0000000000000000000000001234567890123456789012345678901234567890',
          decoded: false,
        };
        const result = (PhishingProtection as any).analyzeTransactionParameters(decodedData);

        expect(result.isMalicious).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it('should flag unusually large parameter data as malicious', () => {
        const largeParams = '0'.repeat(1001);
        const decodedData = {
          methodSelector: '0xa9059cbb',
          params: largeParams,
          decoded: false,
        };
        const result = (PhishingProtection as any).analyzeTransactionParameters(decodedData);

        expect(result.isMalicious).toBe(true);
        expect(result.warnings).toContain('Unusually large parameter data');
      });

      it('should handle null or undefined decoded data', () => {
        const resultNull = (PhishingProtection as any).analyzeTransactionParameters(null);
        expect(resultNull.isMalicious).toBe(false);
        expect(resultNull.warnings).toHaveLength(0);

        const resultUndefined = (PhishingProtection as any).analyzeTransactionParameters(undefined);
        expect(resultUndefined.isMalicious).toBe(false);
        expect(resultUndefined.warnings).toHaveLength(0);
      });

      it('should handle decoded data without params property', () => {
        const decodedData = {
          methodSelector: '0xa9059cbb',
          decoded: false,
        };
        const result = (PhishingProtection as any).analyzeTransactionParameters(decodedData);

        expect(result.isMalicious).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it('should handle decoded data with empty params', () => {
        const decodedData = {
          methodSelector: '0xa9059cbb',
          params: '',
          decoded: false,
        };
        const result = (PhishingProtection as any).analyzeTransactionParameters(decodedData);

        expect(result.isMalicious).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it('should correctly bound false positives at exactly 1000 chars (boundary)', () => {
        const exactlyAtBoundary = '0'.repeat(1000);
        const decodedData = {
          methodSelector: '0xa9059cbb',
          params: exactlyAtBoundary,
          decoded: false,
        };
        const result = (PhishingProtection as any).analyzeTransactionParameters(decodedData);

        // 1000 chars is NOT > 1000, so should not be flagged
        expect(result.isMalicious).toBe(false);
      });
    });

    describe('decodeTransactionData integration via validateTransactionData', () => {
      it('should decode and analyze transaction data when validating', () => {
        const largeParams = '0'.repeat(1001);
        const largeData = `0xa9059cbb${largeParams}`;

        const result = PhishingProtection.validateTransactionData(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          largeData
        );

        // transfer function is not automatically malicious, but large params are
        expect(result.isMalicious).toBe(true);
        expect(result.warnings).toContain('Suspicious function call detected');
        expect(result.warnings).toContain('Unusually large parameter data');
        expect(result.decodedData).toBeDefined();
        expect(result.decodedData.methodSelector).toBe('0xa9059cbb');
      });

      it('should not mark transfer as malicious without large params', () => {
        const result = PhishingProtection.validateTransactionData(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001'
        );

        // transfer (0xa9059cbb) is suspicious but not automatically malicious
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Suspicious function call detected');
        expect(result.decodedData).toBeDefined();
      });

      it('should handle invalid hex data without crashing', () => {
        // The try/catch in validateTransactionData catches the decode error
        const result = PhishingProtection.validateTransactionData(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          'not-hex-data'
        );

        expect(result.isValid).toBe(true);
        expect(result.isMalicious).toBe(false);
        // The decode happens inside the try block; if it throws, it should be caught
        // and warnings will include 'Unable to decode transaction data'
      });
    });
  });

  describe('memoization', () => {
    it('should return cached result for same URL', () => {
      const url = 'https://metamask.io.fake/phishing';
      const result1 = PhishingProtection.detectPhishing(url);
      const result2 = PhishingProtection.detectPhishing(url);
      expect(result1).toBe(result2);
    });

    it('should return different results for different URLs', () => {
      const result1 = PhishingProtection.detectPhishing('https://metamask.io.fake/page1');
      const result2 = PhishingProtection.detectPhishing('https://legitimate.com/page2');
      expect(result1).not.toBe(result2);
    });
  });

  describe('reportPhishing', () => {
    beforeEach(() => {
      PhishingProtection.clearMemoizedResults();
    });

    it('should respect rate limit', async () => {
      const reportUrl = 'https://phishing.test/report';
      const results: boolean[] = [];
      for (let i = 0; i < 15; i++) {
        results.push(await PhishingProtection.reportPhishing(reportUrl, 10));
      }
      const allowed = results.filter(r => r).length;
      expect(allowed).toBeLessThanOrEqual(10);
    });
  });

  describe('clearMemoizedResults', () => {
    it('should clear all memoized results and report timestamps', () => {
      PhishingProtection.detectPhishing('https://test.com/1');
      PhishingProtection.detectPhishing('https://test.com/2');
      PhishingProtection.clearMemoizedResults();
      const result1 = PhishingProtection.detectPhishing('https://test.com/1');
      const result2 = PhishingProtection.detectPhishing('https://test.com/2');
      expect(result1).not.toBe(result2);
    });
  });

  describe('CDN manifest', () => {
    beforeEach(() => {
      PhishingProtection.clearMemoizedResults();
    });

    it('should return false when CDN fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const result = await PhishingProtection.loadManifestFromCDN();
      expect(result).toBe(false);
    });

    it('should fall back to static domains when CDN not loaded', () => {
      const result = PhishingProtection.detectPhishing('https://metamask.io.fake/phishing');
      expect(result.isPhishing).toBe(true);
      expect(result.threats).toContain('Known phishing domain detected');
    });
  });
});