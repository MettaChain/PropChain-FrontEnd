import { decideStepUpSecurity, ethToWei } from '../transactionSecurity';

describe('transactionSecurity helpers', () => {
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
});

