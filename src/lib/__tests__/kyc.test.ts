import { DEFAULT_KYC_THRESHOLD_ETH, shouldRequireKyc, weiToEth, formatEthAmount } from '../kyc';

describe('kyc helpers', () => {
  it('converts wei to eth', () => {
    expect(weiToEth('1000000000000000000')).toBe(1);
    expect(weiToEth('2500000000000000000')).toBe(2.5);
  });

  it('detects when kyc is required', () => {
    expect(shouldRequireKyc('10000000000000000000', DEFAULT_KYC_THRESHOLD_ETH)).toBe(true);
    expect(shouldRequireKyc('1000000000000000000', DEFAULT_KYC_THRESHOLD_ETH)).toBe(false);
  });

  it('formats eth amounts for display', () => {
    expect(formatEthAmount(10)).toBe('10');
    expect(formatEthAmount(12.5)).toBe('12.5');
  });
});
