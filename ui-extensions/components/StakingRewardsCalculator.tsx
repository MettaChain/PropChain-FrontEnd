"use client";

export interface StakingRewardsCalculatorProps {
  amount: number;
  apy: number;
  durationYears: number;
  maxStake?: number;
  dark?: boolean;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function StakingRewardsCalculator({
  amount,
  apy,
  durationYears,
  maxStake = 1_000_000,
  dark = false,
}: StakingRewardsCalculatorProps) {
  const safeAmount = Math.min(Math.max(0, amount), maxStake);
  const safeApy = Math.max(0, apy);
  const safeDuration = Math.max(0, durationYears);
  const total = safeAmount * Math.pow(1 + safeApy / 100, safeDuration);
  const rewards = total - safeAmount;
  const surface = dark
    ? "border-slate-700 bg-slate-900 text-white"
    : "border-slate-200 bg-white text-slate-900";

  return (
    <section aria-label="Staking rewards calculator" className={`w-full rounded-xl border p-5 shadow-sm ${surface}`}>
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-500">Estimated staking rewards</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{currency.format(rewards)}</p>
        <p className="mt-1 text-sm text-slate-500">Estimated total: {currency.format(total)}</p>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-100/80 p-3 dark:bg-slate-800">
          <dt className="text-xs text-slate-500">Stake</dt>
          <dd className="mt-1 font-semibold tabular-nums">{currency.format(safeAmount)}</dd>
        </div>
        <div className="rounded-lg bg-slate-100/80 p-3 dark:bg-slate-800">
          <dt className="text-xs text-slate-500">APY</dt>
          <dd className="mt-1 font-semibold tabular-nums">{safeApy.toFixed(2)}%</dd>
        </div>
        <div className="rounded-lg bg-slate-100/80 p-3 dark:bg-slate-800">
          <dt className="text-xs text-slate-500">Duration</dt>
          <dd className="mt-1 font-semibold tabular-nums">{safeDuration} years</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-slate-500">Illustrative estimate using annual compounding. Actual rewards may vary.</p>
    </section>
  );
}

export default StakingRewardsCalculator;
