import { act, renderHook } from '@testing-library/react';
import { useTransactionSecurityStore } from '../transactionSecurityStore';

const mockBuildOtpAuthUri = jest.fn(
  ({ secret, issuer, accountName }: { secret: string; issuer: string; accountName: string }) =>
    `otpauth://totp/${issuer}:${accountName}?secret=${secret}`,
);
const mockCreateTrustedDeviceId = jest.fn(() => 'device-mock-1');
const mockGenerateTotpSecret = jest.fn(() => 'MOCK-SECRET-123');
const mockVerifyTotpCode = jest.fn(async ({ code }: { code: string }) => code === '123456');

jest.mock('@/utils/security/transactionSecurity', () => ({
  buildOtpAuthUri: (...args: unknown[]) => mockBuildOtpAuthUri(...args),
  createTrustedDeviceId: (...args: unknown[]) => mockCreateTrustedDeviceId(...args),
}));

jest.mock('@/utils/security/totp', () => ({
  generateTotpSecret: (...args: unknown[]) => mockGenerateTotpSecret(...args),
  verifyTotpCode: (...args: unknown[]) => mockVerifyTotpCode(...args),
}));

describe('transactionSecurityStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionSecurityStore.getState().resetSecurity();
  });

  it('has sensible default settings', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());
    expect(result.current.settings.thresholdEth).toBe(2);
    expect(result.current.settings.twoFactorRequired).toBe(true);
    expect(result.current.settings.totpEnabled).toBe(true);
    expect(result.current.settings.trustedDeviceDurationDays).toBe(30);
    expect(result.current.settings.totpSecret).toBeNull();
    expect(result.current.trustedDevices).toEqual([]);
    expect(result.current.lastVerifiedAt).toBeNull();
    expect(result.current.lastVerificationMethod).toBeNull();
  });

  it('updates settings partially', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.updateSettings({ thresholdEth: 5, twoFactorRequired: false });
    });

    expect(result.current.settings.thresholdEth).toBe(5);
    expect(result.current.settings.twoFactorRequired).toBe(false);
    expect(result.current.settings.totpEnabled).toBe(true); // untouched
  });

  it('enrolls TOTP and returns the secret and otpauth URI', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    let enrolled: { secret: string; otpauthUri: string } | undefined;
    act(() => {
      enrolled = result.current.enrollTotp('My wallet');
    });

    expect(mockGenerateTotpSecret).toHaveBeenCalled();
    expect(enrolled?.secret).toBe('MOCK-SECRET-123');
    expect(enrolled?.otpauthUri).toContain('otpauth://totp/');
    expect(result.current.settings.totpEnabled).toBe(true);
    expect(result.current.settings.totpSecret).toBe('MOCK-SECRET-123');
    expect(result.current.settings.totpAccountLabel).toBe('My wallet');
  });

  it('verifies a valid TOTP code and records the verification', async () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.enrollTotp();
    });

    await act(async () => {
      const ok = await result.current.verifyTotpCode('123456');
      expect(ok).toBe(true);
    });

    expect(result.current.lastVerifiedAt).not.toBeNull();
    expect(result.current.lastVerificationMethod).toBe('totp');
  });

  it('rejects an invalid TOTP code without recording verification', async () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.enrollTotp();
    });

    await act(async () => {
      const ok = await result.current.verifyTotpCode('000000');
      expect(ok).toBe(false);
    });

    expect(result.current.lastVerifiedAt).toBeNull();
    expect(result.current.lastVerificationMethod).toBeNull();
  });

  it('returns false when verifying without an enrolled secret', async () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    await act(async () => {
      const ok = await result.current.verifyTotpCode('123456');
      expect(ok).toBe(false);
    });
  });

  it('trusts a device and sets the verification method', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.trustDevice('device-abc', 'Work laptop');
    });

    expect(result.current.trustedDevices).toHaveLength(1);
    expect(result.current.trustedDevices[0].id).toBe('device-abc');
    expect(result.current.trustedDevices[0].label).toBe('Work laptop');
    expect(result.current.trustedDevices[0].trustUntil).toBeGreaterThan(Date.now());
    expect(result.current.lastVerificationMethod).toBe('trusted-device');
  });

  it('deduplicates trusted devices by id', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.trustDevice('device-abc', 'First');
      result.current.trustDevice('device-abc', 'Second');
    });

    expect(result.current.trustedDevices).toHaveLength(1);
    expect(result.current.trustedDevices[0].label).toBe('Second');
  });

  it('returns an active trusted device while it has not expired', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.trustDevice('device-abc');
    });

    expect(result.current.getActiveTrustedDevice('device-abc')).not.toBeNull();
    expect(result.current.getActiveTrustedDevice('unknown')).toBeNull();
  });

  it('returns null for an expired trusted device', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.trustDevice('device-abc');
    });

    // Advance past the 30-day trust window.
    act(() => {
      jest.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);
    });

    expect(result.current.getActiveTrustedDevice('device-abc')).toBeNull();
    jest.useRealTimers();
  });

  it('revokes and clears trusted devices', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.trustDevice('device-1');
      result.current.trustDevice('device-2');
      result.current.revokeTrustedDevice('device-1');
    });

    expect(result.current.trustedDevices).toHaveLength(1);
    expect(result.current.trustedDevices[0].id).toBe('device-2');

    act(() => {
      result.current.clearTrustedDevices();
    });

    expect(result.current.trustedDevices).toEqual([]);
  });

  it('records a manual verification method', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.setLastVerification('hardware-wallet');
    });

    expect(result.current.lastVerificationMethod).toBe('hardware-wallet');
    expect(result.current.lastVerifiedAt).not.toBeNull();
  });

  it('resets security state to defaults', () => {
    const { result } = renderHook(() => useTransactionSecurityStore());

    act(() => {
      result.current.updateSettings({ thresholdEth: 50 });
      result.current.trustDevice('device-1');
      result.current.setLastVerification('totp');
      result.current.resetSecurity();
    });

    expect(result.current.settings.thresholdEth).toBe(2);
    expect(result.current.trustedDevices).toEqual([]);
    expect(result.current.lastVerifiedAt).toBeNull();
    expect(result.current.lastVerificationMethod).toBeNull();
  });
});
