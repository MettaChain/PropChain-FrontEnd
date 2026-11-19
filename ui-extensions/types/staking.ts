export enum CompoundingFrequency {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly',
}

export interface StakingTier {
  id: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  /** Annual percentage rate, e.g. 5.5 for 5.5% */
  apr: number;
  lockPeriodDays: number;
}

export interface StakingParameters {
  principal: number;
  apr: number;
  durationDays: number;
  compounding: CompoundingFrequency;
  tier?: StakingTier;
}

export interface RewardScheduleEntry {
  period: number;
  /** ISO 8601 date */
  date: string;
  reward: number;
  cumulativeReward: number;
  balance: number;
}

export interface StakingProjection {
  parameters: StakingParameters;
  totalReward: number;
  finalBalance: number;
  /** Effective annual percentage yield */
  apy: number;
  schedule: RewardScheduleEntry[];
}
