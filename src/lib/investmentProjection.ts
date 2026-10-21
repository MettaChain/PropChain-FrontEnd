/**
 * Projection maths for the investment calculator widget.
 *
 * The widget is embedded in other people's pages, so the numbers it shows are
 * the first thing a visitor reads. They are calculated here, in one pure
 * function, so they can be unit tested without rendering anything and so the
 * component can memoise the result instead of recomputing it on every render.
 */

/** The inputs the projection is calculated from. */
export interface InvestmentProjectionInput {
  /** Amount invested, in the investment currency. */
  investment: number;
  /** Expected annual rental yield, in percent. */
  yieldRate: number;
  /** Holding period, in years. */
  holdingPeriod: number;
  /** Expected annual appreciation, in percent. */
  appreciation: number;
}

/** The projection of an investment over the holding period. */
export interface InvestmentProjection {
  /** Rental income plus capital gains over the whole holding period. */
  totalReturn: number;
  /** Average of the total return per year. */
  annualReturn: number;
  /** Total return as a percentage of the amount invested. */
  roi: number;
  /** Months of rental income needed to cover the amount invested. */
  breakEvenMonths: number;
  /** Internal rate of return over the holding period, in percent. */
  irr: number;
  /** Value of the investment at the end of the holding period. */
  finalValue: number;
  /** Rental income over the whole holding period. */
  totalRentalIncome: number;
  /** Growth of the value of the investment over the holding period. */
  capitalGains: number;
}

const EMPTY_PROJECTION: InvestmentProjection = {
  totalReturn: 0,
  annualReturn: 0,
  roi: 0,
  breakEvenMonths: 0,
  irr: 0,
  finalValue: 0,
  totalRentalIncome: 0,
  capitalGains: 0,
};

/**
 * Calculate the projection of an investment.
 *
 * The inputs come from free-form number fields, so anything can arrive here:
 * an empty field, a zero, a negative number. A projection is only meaningful
 * for a positive amount invested over a positive holding period, so anything
 * else is projected as zero instead of being divided by zero and rendered as
 * `NaN`.
 *
 * @param input - The amount invested, the yield, the holding period and the appreciation.
 * @returns The projection, with every figure in the investment currency except
 * the percentages and the break-even period.
 */
export function calculateInvestmentProjection({
  investment,
  yieldRate,
  holdingPeriod,
  appreciation,
}: InvestmentProjectionInput): InvestmentProjection {
  const principal = Number.isFinite(investment) && investment > 0 ? investment : 0;
  const annualYield = Number.isFinite(yieldRate) ? yieldRate : 0;
  const years = Number.isFinite(holdingPeriod) && holdingPeriod > 0 ? holdingPeriod : 0;
  const annualAppreciation = Number.isFinite(appreciation) ? appreciation : 0;

  if (principal === 0 || years === 0) {
    return { ...EMPTY_PROJECTION };
  }

  const annualRentalIncome = principal * (annualYield / 100);
  const totalRentalIncome = annualRentalIncome * years;
  const finalValue = principal * Math.pow(1 + annualAppreciation / 100, years);
  const capitalGains = finalValue - principal;
  const totalReturn = totalRentalIncome + capitalGains;

  // The base of the IRR is the value of the investment at the end of the
  // period, relative to the amount invested. It can only be raised to a
  // fractional power when it is positive.
  const irrBase = (principal + totalReturn) / principal;

  return {
    totalReturn,
    annualReturn: totalReturn / years,
    roi: (totalReturn / principal) * 100,
    breakEvenMonths: annualRentalIncome > 0 ? Math.ceil((principal / annualRentalIncome) * 12) : 0,
    irr: irrBase > 0 ? (Math.pow(irrBase, 1 / years) - 1) * 100 : 0,
    finalValue,
    totalRentalIncome,
    capitalGains,
  };
}
