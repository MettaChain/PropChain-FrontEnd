/**
 * Investor sentiment from on-chain activity (#1434).
 *
 * Three signals are normalised to -1…1 and combined: transaction volume,
 * staking net flow and governance participation. Input data is injected so the
 * service can be unit tested without a chain connection.
 */

export interface OnChainTransaction {
  valueUsd: number;
  at?: string;
}

export interface SentimentInput {
  transactions: OnChainTransaction[];
  /** Positive means staked tokens flowed in, negative means out. */
  stakingNetFlowUsd: number;
  stakingTotalUsd: number;
  governanceVotes: number;
  governanceEligible: number;
}

export interface SentimentBreakdown {
  volume: number;
  staking: number;
  governance: number;
}

export interface SentimentResult {
  score: number;
  breakdown: SentimentBreakdown;
  label: 'bearish' | 'neutral' | 'bullish';
}

/** Volume that counts as a fully bullish signal. */
export const VOLUME_BASELINE_USD = 1_000_000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number): number => Math.round(value * 1000) / 1000;

/** Total USD value of the supplied transactions. */
export function aggregateTransactionVolume(transactions: OnChainTransaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.valueUsd, 0);
}

/** Net staking flow as a share of the staked supply, clamped to -1…1. */
export function stakingTrend(netFlowUsd: number, totalStakedUsd: number): number {
  if (totalStakedUsd <= 0) return 0;
  return round(clamp(netFlowUsd / totalStakedUsd, -1, 1));
}

/** Governance participation rate, 0…1. */
export function governanceParticipation(votes: number, eligible: number): number {
  if (eligible <= 0) return 0;
  return round(clamp(votes / eligible, 0, 1));
}

/** Combine the three signals into a -1…1 score with a plain-language label. */
export function computeSentiment(input: SentimentInput): SentimentResult {
  const volume = round(clamp(aggregateTransactionVolume(input.transactions) / VOLUME_BASELINE_USD, 0, 1));
  const staking = stakingTrend(input.stakingNetFlowUsd, input.stakingTotalUsd);
  const governance = round(
    (governanceParticipation(input.governanceVotes, input.governanceEligible) - 0.5) * 2,
  );

  const score = round(volume * 0.4 + staking * 0.4 + governance * 0.2);
  const label = score > 0.15 ? 'bullish' : score < -0.15 ? 'bearish' : 'neutral';

  return { score, breakdown: { volume, staking, governance }, label };
}
