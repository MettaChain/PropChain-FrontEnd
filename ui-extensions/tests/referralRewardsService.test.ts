import {
  calculateReferralReward,
  calculateRewardShares,
  directConversionsCount,
  distributeRewards,
  recordConversion,
  referralChain,
  tierForConversions,
  type ReferralLedger,
} from '../lib/referralRewardsService';

// b referred c, c referred d, d referred e  →  four levels above e's referee.
const links = [
  { referrerId: 'a', refereeId: 'b' },
  { referrerId: 'b', refereeId: 'c' },
  { referrerId: 'c', refereeId: 'd' },
  { referrerId: 'd', refereeId: 'e' },
];

const ledger: ReferralLedger = { links, conversions: [] };

describe('referral rewards', () => {
  it('maps conversion counts to tiers at the boundaries', () => {
    expect(tierForConversions(0)).toBe('bronze');
    expect(tierForConversions(2)).toBe('bronze');
    expect(tierForConversions(3)).toBe('silver');
    expect(tierForConversions(9)).toBe('silver');
    expect(tierForConversions(10)).toBe('gold');
  });

  it('calculates the reward from the tier rate and ignores non-positive amounts', () => {
    expect(calculateReferralReward('gold', 1000)).toBe(50);
    expect(calculateReferralReward('silver', 1000)).toBe(30);
    expect(calculateReferralReward('bronze', 0)).toBe(0);
    expect(calculateReferralReward('bronze', -500)).toBe(0);
  });

  it('walks the referral chain up to three levels', () => {
    expect(referralChain(links, 'e')).toEqual(['d', 'c', 'b']);
    expect(referralChain(links, 'b')).toEqual(['a']);
    expect(referralChain(links, 'nobody')).toEqual([]);
  });

  it('splits one conversion across the three nearest referrers', () => {
    expect(distributeRewards(ledger, { refereeId: 'e', amount: 1000 })).toEqual({
      d: 20,
      c: 10,
      b: 5,
    });
  });

  it('raises a referrer tier as their direct conversions grow', () => {
    const manyConversions = Array.from({ length: 10 }, (_, index) => ({
      refereeId: `direct-${index}`,
      amount: 100,
    }));
    const withDirect: ReferralLedger = {
      links: [...links, ...manyConversions.map((c) => ({ referrerId: 'd', refereeId: c.refereeId }))],
      conversions: manyConversions,
    };

    expect(directConversionsCount(withDirect, 'd')).toBe(10);

    const [share] = calculateRewardShares(withDirect, { refereeId: 'e', amount: 1000 });
    expect(share).toEqual({ referrerId: 'd', level: 1, tier: 'gold', reward: 50 });
  });

  it('records conversions without mutating the previous ledger', () => {
    const conversion = { refereeId: 'e', amount: 100 };
    const next = recordConversion(ledger, conversion);

    expect(ledger.conversions).toHaveLength(0);
    expect(next.conversions).toEqual([conversion]);
  });
});
