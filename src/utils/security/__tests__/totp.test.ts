import { buildOtpAuthUri, generateTotpCode, generateTotpSecret, normalizeTotpCode, verifyTotpCode } from '../totp';

declare global {
  // eslint-disable-next-line no-var
  var crypto: Crypto;
}

if (!global.crypto?.subtle) {
  const { webcrypto } = require('node:crypto');
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
  });
}

describe('totp helpers', () => {
  it('generates a valid authenticator code for the same time window', async () => {
    const secret = generateTotpSecret();
    const timestamp = Date.UTC(2026, 3, 25, 12, 0, 0);

    const code = await generateTotpCode(secret, timestamp);

    expect(code).toHaveLength(6);
    expect(await verifyTotpCode({ secret, code, timestamp })).toBe(true);
  });

  it('rejects invalid TOTP codes', async () => {
    const secret = generateTotpSecret();
    const timestamp = Date.UTC(2026, 3, 25, 12, 0, 0);

    expect(await verifyTotpCode({ secret, code: '000000', timestamp })).toBe(false);
  });

  it('builds an otpauth URI for enrollment', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = buildOtpAuthUri({
      secret,
      issuer: 'PropChain',
      accountName: 'Primary wallet',
    });

    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(`secret=${secret}`);
  });

  it('normalizes pasted codes', () => {
    expect(normalizeTotpCode('12 34-56')).toBe('123456');
  });
});

