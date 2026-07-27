import { decideStepUpSecurity, ethToWei, getSecurityDeviceId } from '../transactionSecurity';

describe('transactionSecurity helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires step-up for values at or above the configured threshold', () => {
    const decision = decideStepUpSecurity({
      valueWei: ethToWei(3),
      thresholdEth: 2,
      twoFactorRequired: true,
      trustedDeviceBypassEnabled: true,
      trustedDeviceActive: false,
    });

    expect(decision.requiresStepUp).toBe(true);
    expect(decision.reason).toMatch(/threshold/i);
  });

  it('skips step-up when a trusted device bypass is active', () => {
    const decision = decideStepUpSecurity({
      valueWei: ethToWei(5),
      thresholdEth: 2,
      twoFactorRequired: true,
      trustedDeviceBypassEnabled: true,
      trustedDeviceActive: true,
    });

    expect(decision.requiresStepUp).toBe(false);
    expect(decision.reason).toMatch(/trusted device/i);
  });

  it('does not require step-up when the feature is disabled', () => {
    const decision = decideStepUpSecurity({
      valueWei: ethToWei(50),
      thresholdEth: 2,
      twoFactorRequired: false,
      trustedDeviceBypassEnabled: true,
      trustedDeviceActive: false,
    });

    expect(decision.requiresStepUp).toBe(false);
    expect(decision.reason).toBeNull();
  });

  describe('getSecurityDeviceId', () => {
    let mockLocalStorage: Record<string, string>;
    let mockSessionStorage: Record<string, string>;

    beforeEach(() => {
      mockLocalStorage = {};
      mockSessionStorage = {};
      jest.spyOn(globalThis, 'crypto', 'get').mockReturnValue({
        randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
        subtle: {} as SubtleCrypto,
        getRandomValues: (arr: Uint8Array) => arr,
      } as unknown as Crypto);
      jest.spyOn(globalThis, 'localStorage', 'get').mockReturnValue({
        getItem: (key: string) => mockLocalStorage[key] ?? null,
        setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
        removeItem: (key: string) => { delete mockLocalStorage[key]; },
        clear: () => { mockLocalStorage = {}; },
        get length() { return Object.keys(mockLocalStorage).length; },
        key: (index: number) => Object.keys(mockLocalStorage)[index] ?? null,
      } as Storage);
      jest.spyOn(globalThis, 'sessionStorage', 'get').mockReturnValue({
        getItem: (key: string) => mockSessionStorage[key] ?? null,
        setItem: (key: string, value: string) => { mockSessionStorage[key] = value; },
        removeItem: (key: string) => { delete mockSessionStorage[key]; },
        clear: () => { mockSessionStorage = {}; },
        get length() { return Object.keys(mockSessionStorage).length; },
        key: (index: number) => Object.keys(mockSessionStorage)[index] ?? null,
      } as Storage);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns "server-device" when window is undefined', () => {
      const windowSpy = jest.spyOn(globalThis, 'window', 'get').mockReturnValue(undefined as any);
      expect(getSecurityDeviceId()).toBe('server-device');
      windowSpy.mockRestore();
    });

    it('generates and stores a salted hash on first call', () => {
      const result = getSecurityDeviceId();

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockSessionStorage['propchain-session-salt']).toBeDefined();
      expect(mockLocalStorage['propchain-security-device-id-hash']).toBeDefined();
      expect(mockLocalStorage['propchain-security-device-id-hash']).not.toBe(result);
    });

    it('reuses existing hash from localStorage on subsequent calls', () => {
      const existingHash = 'a1b2c3d4';
      mockLocalStorage['propchain-security-device-id-hash'] = existingHash;

      const result = getSecurityDeviceId();

      expect(result).toBe(existingHash);
      expect(mockSessionStorage['propchain-session-salt']).toBeUndefined();
    });

    it('reuses session salt across calls within the same session', () => {
      const sessionSalt = 'test-session-salt';
      mockSessionStorage['propchain-session-salt'] = sessionSalt;

      getSecurityDeviceId();

      expect(mockSessionStorage['propchain-session-salt']).toBe(sessionSalt);
    });

    it('stores a hashed value, not the raw UUID', () => {
      getSecurityDeviceId();

      const storedValue = mockLocalStorage['propchain-security-device-id-hash'];
      expect(storedValue).not.toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(storedValue).toMatch(/^[0-9a-f]{8,}$/);
    });
  });
});

