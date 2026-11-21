/**
 * Referral reward calculation and distribution (#1432).
 *
 * A referral ledger is a list of referral links (who referred whom) plus the
 * conversions to reward. Rewards flow up to three levels, weighted by tier.
 */

export type ReferralTier = 'bronze' | 'silver' | 'gold';

export const REFERRAL_TIER_RATES: Record<ReferralTier, number> = {
  bronze: 0.02,
  silver: 0.03,
  gold: 0.05,
};

/** Share of the referrer's reward paid to each level, nearest level first. */
export const REFERRAL_LEVEL_SHARES: readonly number[] = [1, 0.5, 0.25];
export const MAX_REFERRAL_LEVELS = REFERRAL_LEVEL_SHARES.length;

export interface ReferralLink {
  referrerId: string;
  refereeId: string;
}

export interface ReferralConversion {
  refereeId: string;
  amount: number;
  at?: string;
}

export interface ReferralLedger {
  links: ReferralLink[];
  conversions: ReferralConversion[];
}

export interface RewardShare {
  referrerId: string;
  level: number;
  tier: ReferralTier;
  reward: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Tier a referrer earns from their number of direct conversions. */
export function tierForConversions(count: number): ReferralTier {
  if (count >= 10) return 'gold';
  if (count >= 3) return 'silver';
  return 'bronze';
}

/** Reward earned by a referrer for a conversion of `amount`. */
export function calculateReferralReward(tier: ReferralTier, amount: number): number {
  if (amount <= 0) return 0;
  return round2(amount * REFERRAL_TIER_RATES[tier]);
}

/** Referrers above `refereeId`, nearest first, capped at three levels. */
export function referralChain(
  links: ReferralLink[],
  refereeId: string,
  maxLevels: number = MAX_REFERRAL_LEVELS,
): string[] {
  const parentOf = new Map(links.map((link) => [link.refereeId, link.referrerId]));
  const chain: string[] = [];
  let current = parentOf.get(refereeId);
  while (current && chain.length < maxLevels && !chain.includes(current)) {
    chain.push(current);
    current = parentOf.get(current);
  }
  return chain;
}

/** Number of conversions attributed directly to a referrer. */
export function directConversionsCount(ledger: ReferralLedger, referrerId: string): number {
  return ledger.conversions.filter(
    (conversion) => referralChain(ledger.links, conversion.refereeId)[0] === referrerId,
  ).length;
}

/** Append a conversion to the ledger without mutating the input. */
export function recordConversion(
  ledger: ReferralLedger,
  conversion: ReferralConversion,
): ReferralLedger {
  return { ...ledger, conversions: [...ledger.conversions, conversion] };
}

/** Reward split for every eligible referrer above the converting referee. */
export function calculateRewardShares(
  ledger: ReferralLedger,
  conversion: ReferralConversion,
): RewardShare[] {
  return referralChain(ledger.links, conversion.refereeId).map((referrerId, index) => {
    const tier = tierForConversions(directConversionsCount(ledger, referrerId));
    const reward = calculateReferralReward(tier, conversion.amount) * REFERRAL_LEVEL_SHARES[index];
    return { referrerId, level: index + 1, tier, reward: round2(reward) };
  });
}

/** Total reward owed to each referrer for one conversion. */
export function distributeRewards(
  ledger: ReferralLedger,
  conversion: ReferralConversion,
): Record<string, number> {
  return calculateRewardShares(ledger, conversion).reduce<Record<string, number>>(
    (payouts, share) => {
      payouts[share.referrerId] = round2((payouts[share.referrerId] ?? 0) + share.reward);
      return payouts;
    },
    {},
  );
}
