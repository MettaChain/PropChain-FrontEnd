import { validateQRCodeUrl, getDisplaySafeUrl, MAX_QR_CODE_URL_LENGTH } from '../qrCodeSecurity';

// Mock PhishingProtection
jest.mock('../phishingProtection', () => ({
  PhishingProtection: {
    detectPhishing: jest.fn((url: string) => {
      // Simulate phishing detection for known patterns
      if (url.includes('phishing') || url.includes('.fake') || url.includes('.scam')) {
        return {
          isPhishing: true,
          riskScore: 90,
          threats: ['Known phishing domain detected'],
          warnings: [],
        };
      }
      if (url.includes('suspicious')) {
        return {
          isPhishing: false,
          riskScore: 50,
          threats: [],
          warnings: ['Suspicious domain pattern'],
        };
      }
      return {
        isPhishing: false,
        riskScore: 0,
        threats: [],
        warnings: [],
      };
    }),
  },
}));

describe('qrCodeSecurity', () => {
  describe('validateQRCodeUrl', () => {
    it('accepts valid HTTPS URLs', () => {
      const result = validateQRCodeUrl('https://propchain.io/properties/abc');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://propchain.io/properties/abc');
    });

    it('accepts valid HTTP URLs', () => {
      const result = validateQRCodeUrl('http://example.com');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('http://example.com/');
    });

    it('trims whitespace before validation', () => {
      const result = validateQRCodeUrl('  https://propchain.io  ');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://propchain.io/');
    });

    it('rejects empty URLs', () => {
      const result = validateQRCodeUrl('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('empty_url');
    });

    it('rejects unsafe protocols', () => {
      expect(validateQRCodeUrl('javascript:alert(1)').error).toBe('unsafe_protocol');
      expect(validateQRCodeUrl('data:text/plain,hello').error).toBe('unsafe_protocol');
      expect(validateQRCodeUrl('blob:https://example.com/id').error).toBe('unsafe_protocol');
    });

    it('rejects vbscript protocol', () => {
      const result = validateQRCodeUrl('vbscript:msgbox(1)');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('unsafe_protocol');
      expect(result.warnings).toContain('Blocked unsafe URL protocol');
    });

    it('rejects malformed URLs', () => {
      const result = validateQRCodeUrl('not-a-valid-url');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_url');
    });

    it('rejects URLs that exceed max length', () => {
      const longUrl = `https://propchain.io/${'a'.repeat(MAX_QR_CODE_URL_LENGTH)}`;
      const result = validateQRCodeUrl(longUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('url_too_long');
    });

    it('accepts URLs at exactly max length', () => {
      const baseUrl = 'https://propchain.io/';
      const padding = 'a'.repeat(MAX_QR_CODE_URL_LENGTH - baseUrl.length);
      const url = baseUrl + padding;

      const result = validateQRCodeUrl(url);

      expect(result.isValid).toBe(true);
    });

    it('rejects known phishing domains', () => {
      const result = validateQRCodeUrl('https://metamask.io.fake/login');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('phishing_detected');
    });

    it('warns when host is not on the allowed list', () => {
      const result = validateQRCodeUrl('https://example.com/property/1', ['propchain.io']);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('URL host is not on the allowed list');
    });

    it('accepts host that exactly matches allowed list', () => {
      const result = validateQRCodeUrl('https://propchain.io/property/1', ['propchain.io']);

      expect(result.isValid).toBe(true);
      expect(result.warnings).not.toContain('URL host is not on the allowed list');
    });

    it('accepts subdomain of an allowed host', () => {
      const result = validateQRCodeUrl(
        'https://app.propchain.io/property/1',
        ['propchain.io']
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).not.toContain('URL host is not on the allowed list');
    });

    it('rejects unsupported protocols like deep-links', () => {
      expect(validateQRCodeUrl('ethereum:0x1234').error).toBe('unsupported_protocol');
      expect(validateQRCodeUrl('wc:1234@1?key=abc').error).toBe('unsupported_protocol');
      expect(validateQRCodeUrl('ftp://files.example.com').error).toBe('unsupported_protocol');
    });

    it('rejects empty string after trimming', () => {
      const result = validateQRCodeUrl('   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('empty_url');
    });

    it('includes warnings from non-phishing suspicious domains', () => {
      const result = validateQRCodeUrl('https://suspicious.example.com');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Suspicious domain pattern');
    });

    it('handles URL with uppercase protocol', () => {
      const result = validateQRCodeUrl('HTTPS://PROPCHAIN.IO');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://propchain.io/');
    });
  });

  describe('getDisplaySafeUrl', () => {
    it('returns empty string for invalid URLs', () => {
      expect(getDisplaySafeUrl('javascript:alert(1)')).toBe('');
    });

    it('returns empty string for empty input', () => {
      expect(getDisplaySafeUrl('')).toBe('');
    });

    it('returns full URL when under max length', () => {
      const result = getDisplaySafeUrl('https://propchain.io/short');

      expect(result).toBe('https://propchain.io/short');
    });

    it('truncates long URLs for display', () => {
      const longPath = 'a'.repeat(200);
      const display = getDisplaySafeUrl(`https://propchain.io/${longPath}`, 50);

      expect(display.endsWith('...')).toBe(true);
      expect(display.length).toBeLessThanOrEqual(50);
    });

    it('does not truncate URL at exact max length', () => {
      const url = 'https://propchain.io/abc';
      const result = getDisplaySafeUrl(url, url.length);

      expect(result).toBe(url);
      expect(result.endsWith('...')).toBe(false);
    });
  });
});
