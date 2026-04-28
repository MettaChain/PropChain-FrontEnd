export const DEFAULT_KYC_THRESHOLD_ETH = 10;

const WEI_IN_ETH = BigInt('1000000000000000000');

export function formatEthAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function weiToEth(wei: string): number {
  try {
    return Number(BigInt(wei)) / Number(WEI_IN_ETH);
  } catch {
    return 0;
  }
}

export function shouldRequireKyc(valueWei: string | undefined, thresholdEth: number): boolean {
  if (!valueWei || thresholdEth <= 0) return false;
  return weiToEth(valueWei) >= thresholdEth;
}

export function createComplianceId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
