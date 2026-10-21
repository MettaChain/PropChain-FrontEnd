import { calculateInvestmentProjection } from '@/lib/investmentProjection';

describe('calculateInvestmentProjection', () => {
  it('projects the default figures of the widget', () => {
    const projection = calculateInvestmentProjection({
      investment: 1000,
      yieldRate: 8,
      holdingPeriod: 5,
      appreciation: 3,
    });

    expect(projection.totalRentalIncome).toBeCloseTo(400);
    expect(projection.finalValue).toBeCloseTo(1159.27, 2);
    expect(projection.capitalGains).toBeCloseTo(159.27, 2);
    expect(projection.totalReturn).toBeCloseTo(559.27, 2);
    expect(projection.roi).toBeCloseTo(55.93, 2);
    expect(projection.annualReturn).toBeCloseTo(111.85, 2);
    expect(projection.breakEvenMonths).toBe(150);
    expect(projection.irr).toBeCloseTo(9.29, 2);
  });

  it('reports no break-even month when there is no rental income', () => {
    const projection = calculateInvestmentProjection({
      investment: 1000,
      yieldRate: 0,
      holdingPeriod: 5,
      appreciation: 3,
    });

    expect(projection.breakEvenMonths).toBe(0);
    expect(projection.totalRentalIncome).toBe(0);
    expect(projection.roi).toBeCloseTo(15.93, 2);
  });

  it('reports a loss when the value of the investment drops', () => {
    const projection = calculateInvestmentProjection({
      investment: 1000,
      yieldRate: 0,
      holdingPeriod: 2,
      appreciation: -5,
    });

    expect(projection.capitalGains).toBeCloseTo(-97.5, 2);
    expect(projection.totalReturn).toBeCloseTo(-97.5, 2);
    expect(projection.roi).toBeCloseTo(-9.75, 2);
    expect(projection.annualReturn).toBeCloseTo(-48.75, 2);
    expect(projection.irr).toBeCloseTo(-5, 2);
  });

  it('projects zeroes when nothing is invested', () => {
    const projection = calculateInvestmentProjection({
      investment: 0,
      yieldRate: 8,
      holdingPeriod: 5,
      appreciation: 3,
    });

    expect(projection).toEqual({
      totalReturn: 0,
      annualReturn: 0,
      roi: 0,
      breakEvenMonths: 0,
      irr: 0,
      finalValue: 0,
      totalRentalIncome: 0,
      capitalGains: 0,
    });
  });

  it('projects zeroes when the holding period is zero', () => {
    const projection = calculateInvestmentProjection({
      investment: 1000,
      yieldRate: 8,
      holdingPeriod: 0,
      appreciation: 3,
    });

    expect(projection.roi).toBe(0);
    expect(projection.annualReturn).toBe(0);
    expect(projection.irr).toBe(0);
  });

  it('ignores a negative amount invested', () => {
    const projection = calculateInvestmentProjection({
      investment: -1000,
      yieldRate: 8,
      holdingPeriod: 5,
      appreciation: 3,
    });

    expect(projection.totalReturn).toBe(0);
    expect(projection.roi).toBe(0);
  });

  it('ignores values that are not finite numbers', () => {
    const projection = calculateInvestmentProjection({
      investment: Number.NaN,
      yieldRate: Number.POSITIVE_INFINITY,
      holdingPeriod: Number.NaN,
      appreciation: Number.NaN,
    });

    expect(projection).toEqual({
      totalReturn: 0,
      annualReturn: 0,
      roi: 0,
      breakEvenMonths: 0,
      irr: 0,
      finalValue: 0,
      totalRentalIncome: 0,
      capitalGains: 0,
    });
  });
});
