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

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const SESSION_SALT_KEY = 'propchain-session-salt';

function getSessionSalt(): string {
  let salt = window.sessionStorage.getItem(SESSION_SALT_KEY);
  if (!salt) {
    salt = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_SALT_KEY, salt);
  }
  return salt;
}
const sessionDeviceId = typeof crypto !== 'undefined' ? crypto.randomUUID() : 'server-device';

export function getSecurityDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-device';
  }
  return sessionDeviceId;
}

  const key = 'propchain-security-device-id-hash';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  const salt = getSessionSalt();
  const hashedId = simpleHash(`${deviceId}:${salt}`);
  window.localStorage.setItem(key, hashedId);
  return deviceId;
export async function hashDeviceId(deviceId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(deviceId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

