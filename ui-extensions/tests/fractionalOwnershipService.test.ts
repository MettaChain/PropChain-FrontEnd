import {
  applyPartialSale,
  applyTransfer,
  calculateDividend,
  calculateTokenDistribution,
  calculateVotingPower,
  type TokenHolding,
} from '../lib/fractionalOwnershipService';

const holdings: TokenHolding[] = [
  { holderId: 'alice', tokens: 600 },
  { holderId: 'bob', tokens: 400 },
];

describe('fractional ownership', () => {
  it('distributes tokens proportionally to each allocation', () => {
    expect(
      calculateTokenDistribution(1000, [
        { holderId: 'alice', percent: 60 },
        { holderId: 'bob', percent: 40 },
      ]),
    ).toEqual([
      { holderId: 'alice', tokens: 600 },
      { holderId: 'bob', tokens: 400 },
    ]);
  });

  it('returns no distribution for a non-positive supply', () => {
    expect(calculateTokenDistribution(0, [{ holderId: 'alice', percent: 100 }])).toEqual([]);
  });

  it('computes a proportional dividend rounded to cents', () => {
    expect(calculateDividend(1000, 333, 1000)).toBe(333);
    expect(calculateDividend(100, 1, 3)).toBe(33.33);
  });

  it('pays no dividend for empty or zero positions', () => {
    expect(calculateDividend(0, 100, 1000)).toBe(0);
    expect(calculateDividend(1000, 0, 1000)).toBe(0);
    expect(calculateDividend(1000, 100, 0)).toBe(0);
  });

  it('transfers tokens between holders without mutating the input', () => {
    const next = applyTransfer(holdings, 'alice', 'bob', 100);

    expect(next).toEqual([
      { holderId: 'alice', tokens: 500 },
      { holderId: 'bob', tokens: 500 },
    ]);
    expect(holdings[0].tokens).toBe(600);
  });

  it('creates a holding for a new receiver', () => {
    const next = applyTransfer(holdings, 'alice', 'carol', 100);

    expect(next).toContainEqual({ holderId: 'carol', tokens: 100 });
  });

  it('rejects a transfer larger than the holder position', () => {
    expect(() => applyTransfer(holdings, 'alice', 'bob', 601)).toThrow('Insufficient tokens');
  });

  it('calculates voting power as a share of supply', () => {
    expect(calculateVotingPower(250, 1000)).toBe(0.25);
    expect(calculateVotingPower(0, 1000)).toBe(0);
    expect(calculateVotingPower(100, 0)).toBe(0);
  });

  it('reduces a position on a partial sale', () => {
    const next = applyPartialSale(holdings, 'bob', 100);

    expect(next.find((holding) => holding.holderId === 'bob')?.tokens).toBe(300);
  });
});
