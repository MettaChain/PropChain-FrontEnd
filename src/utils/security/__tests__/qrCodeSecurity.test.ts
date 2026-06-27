import { validateQRCodeUrl, getDisplaySafeUrl, MAX_QR_CODE_URL_LENGTH } from '../qrCodeSecurity';

describe('qrCodeSecurity', () => {
  describe('validateQRCodeUrl', () => {
    it('accepts valid HTTPS URLs', () => {
      const result = validateQRCodeUrl('https://propchain.io/properties/abc');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://propchain.io/properties/abc');
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
  });

  describe('getDisplaySafeUrl', () => {
    it('returns empty string for invalid URLs', () => {
      expect(getDisplaySafeUrl('javascript:alert(1)')).toBe('');
    });

    it('truncates long URLs for display', () => {
      const longPath = 'a'.repeat(200);
      const display = getDisplaySafeUrl(`https://propchain.io/${longPath}`, 50);

      expect(display.endsWith('...')).toBe(true);
      expect(display.length).toBeLessThanOrEqual(50);
    });
  });
});
