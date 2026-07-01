import { formatEther, formatUnits, parseEther, parseUnits } from 'viem';

describe('viem Jest mock', () => {
  it('formats integer token units like viem for component tests', () => {
    expect(formatUnits(1000000000000000000n, 18)).toBe('1');
    expect(formatUnits(1500000000000000000n, 18)).toBe('1.5');
    expect(formatUnits(12345n, 3)).toBe('12.345');
    expect(formatEther(2500000000000000000n)).toBe('2.5');
  });

  it('parses decimal token values into bigint stroops', () => {
    expect(parseUnits('12.345', 3)).toBe(12345n);
    expect(parseUnits('0.000000000000000001', 18)).toBe(1n);
    expect(parseEther('2.5')).toBe(2500000000000000000n);
  });
});
