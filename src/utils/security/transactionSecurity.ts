export interface StepUpSecurityContext {
  valueWei: string | null | undefined;
  thresholdEth: number;
  twoFactorRequired: boolean;
  trustedDeviceBypassEnabled: boolean;
  trustedDeviceActive: boolean;
}

export interface StepUpDecision {
  requiresStepUp: boolean;
  reason: string | null;
  valueEth: number;
}

export const ETH_WEI_FACTOR = 1_000_000_000_000_000_000n;

export function weiToEth(wei: string | null | undefined): number {
  if (!wei) return 0;

  try {
    return Number(BigInt(wei)) / 1e18;
  } catch {
    return 0;
  }
}

export function ethToWei(valueEth: number): string {
  if (!Number.isFinite(valueEth) || valueEth <= 0) {
    return '0';
  }

  const whole = Math.floor(valueEth);
  const fraction = Math.round((valueEth - whole) * 1e18);
  return (BigInt(whole) * ETH_WEI_FACTOR + BigInt(fraction)).toString();
}

export function formatEth(valueEth: number, maximumFractionDigits = 4): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(valueEth);
}

export function decideStepUpSecurity(context: StepUpSecurityContext): StepUpDecision {
  const valueEth = weiToEth(context.valueWei);

  if (!context.twoFactorRequired) {
    return { requiresStepUp: false, reason: null, valueEth };
  }

  if (context.trustedDeviceBypassEnabled && context.trustedDeviceActive) {
    return {
      requiresStepUp: false,
      reason: 'Trusted device bypass is active for this browser.',
      valueEth,
    };
  }

  if (valueEth >= context.thresholdEth) {
    return {
      requiresStepUp: true,
      valueEth,
      reason: `This transaction is above your ${formatEth(context.thresholdEth, 2)} ETH threshold.`,
    };
  }

  return {
    requiresStepUp: false,
    reason: null,
    valueEth,
  };
}

export function createTrustedDeviceId(): string {
  return `trusted_${crypto.randomUUID()}`;
}

export function getSecurityDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-device';
  }

  const key = 'propchain-security-device-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(key, deviceId);
  return deviceId;
}

export function getSecurityDeviceLabel(): string {
  if (typeof navigator === 'undefined') {
    return 'This device';
  }

  const browser = navigator.userAgent.includes('Chrome')
    ? 'Chrome'
    : navigator.userAgent.includes('Firefox')
    ? 'Firefox'
    : navigator.userAgent.includes('Safari')
    ? 'Safari'
    : 'Browser';

  return `${browser} on this device`;
}

