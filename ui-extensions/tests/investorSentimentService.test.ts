import {
  aggregateTransactionVolume,
  computeSentiment,
  governanceParticipation,
  stakingTrend,
} from '../lib/investorSentimentService';

describe('investor sentiment', () => {
  it('aggregates transaction volume', () => {
    expect(
      aggregateTransactionVolume([{ valueUsd: 1000 }, { valueUsd: 2500 }, { valueUsd: 500 }]),
    ).toBe(4000);
    expect(aggregateTransactionVolume([])).toBe(0);
  });

  it('normalises staking net flow and clamps it', () => {
    expect(stakingTrend(500, 1000)).toBe(0.5);
    expect(stakingTrend(-500, 1000)).toBe(-0.5);
    expect(stakingTrend(5000, 1000)).toBe(1);
    expect(stakingTrend(-5000, 1000)).toBe(-1);
    expect(stakingTrend(500, 0)).toBe(0);
  });

  it('computes governance participation rates', () => {
    expect(governanceParticipation(50, 100)).toBe(0.5);
    expect(governanceParticipation(200, 100)).toBe(1);
    expect(governanceParticipation(10, 0)).toBe(0);
  });

  it('reports bullish sentiment when all signals are positive', () => {
    const result = computeSentiment({
      transactions: [{ valueUsd: 1_000_000 }],
      stakingNetFlowUsd: 500,
      stakingTotalUsd: 1000,
      governanceVotes: 80,
      governanceEligible: 100,
    });

    expect(result.label).toBe('bullish');
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.breakdown).toEqual({ volume: 1, staking: 0.5, governance: 0.6 });
  });

  it('reports bearish sentiment on outflows and weak participation', () => {
    const result = computeSentiment({
      transactions: [],
      stakingNetFlowUsd: -500,
      stakingTotalUsd: 1000,
      governanceVotes: 20,
      governanceEligible: 100,
    });

    expect(result.label).toBe('bearish');
    expect(result.score).toBeLessThan(0);
  });

  it('reports neutral sentiment for mixed signals', () => {
    const result = computeSentiment({
      transactions: [{ valueUsd: 250_000 }],
      stakingNetFlowUsd: 0,
      stakingTotalUsd: 1000,
      governanceVotes: 50,
      governanceEligible: 100,
    });

    expect(result.label).toBe('neutral');
    expect(result.score).toBeCloseTo(0.1, 3);
  });

  it('handles empty input without throwing', () => {
    const result = computeSentiment({
      transactions: [],
      stakingNetFlowUsd: 0,
      stakingTotalUsd: 0,
      governanceVotes: 0,
      governanceEligible: 0,
    });

    expect(result.score).toBe(-0.2);
    expect(result.label).toBe('bearish');
  });
});
