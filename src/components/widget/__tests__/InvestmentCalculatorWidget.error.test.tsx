import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestmentCalculatorWidget } from '../InvestmentCalculatorWidget';

/**
 * The calculation is the part of the widget that can fail on its own, so it
 * is mocked here to throw and to recover.
 */
const mockCalculateProjection = jest.fn();

jest.mock('@/lib/investmentProjection', () => ({
  calculateInvestmentProjection: (input: unknown) => mockCalculateProjection(input),
}));

const PROJECTION = {
  totalReturn: 559,
  annualReturn: 112,
  roi: 55.9,
  breakEvenMonths: 150,
  irr: 9.3,
  finalValue: 1159,
  totalRentalIncome: 400,
  capitalGains: 159,
};

describe('InvestmentCalculatorWidget error handling', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockCalculateProjection.mockReset();
    mockCalculateProjection.mockReturnValue(PROJECTION);
    // React logs the error it caught; the assertion is on the fallback.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('catches a failure inside the calculator instead of emptying the frame', () => {
    mockCalculateProjection.mockImplementation(() => {
      throw new Error('the projection failed');
    });

    render(<InvestmentCalculatorWidget />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('The calculator could not be loaded')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Investment Calculator' })
    ).not.toBeInTheDocument();
  });

  it('offers a retry that renders the calculator again', () => {
    // The calculation keeps failing until the retry is pressed.
    let failing = true;
    mockCalculateProjection.mockImplementation(() => {
      if (failing) {
        throw new Error('the projection failed');
      }
      return PROJECTION;
    });

    render(<InvestmentCalculatorWidget />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    failing = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Investment Calculator' })
    ).toBeInTheDocument();
    expect(screen.getByText('+55.9%')).toBeInTheDocument();
  });
});
