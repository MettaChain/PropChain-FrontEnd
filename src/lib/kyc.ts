import { generateTimestampedId } from '@/utils/secureId';

export const DEFAULT_KYC_THRESHOLD_ETH = 10;

const WEI_IN_ETH = BigInt('1000000000000000000');

/**
 * Formats an ETH amount for display.
 */
export function formatEthAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Converts a wei string to ETH as a number.
 */
export function weiToEth(wei: string): number {
  try {
    return Number(BigInt(wei)) / Number(WEI_IN_ETH);
  } catch {
    return 0;
  }
}

/**
 * Whether a purchase of `valueWei` crosses the KYC threshold, in ETH.
 */
export function shouldRequireKyc(valueWei: string | undefined, thresholdEth: number): boolean {
  if (!valueWei || thresholdEth <= 0) return false;
  return weiToEth(valueWei) >= thresholdEth;
}

/**
 * Builds a prefixed, unique compliance reference for an audit trail.
 */
export function createComplianceId(prefix: string): string {
  return generateTimestampedId(prefix);
}
