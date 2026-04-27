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
        '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001'
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
    });
  });
});