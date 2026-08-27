import React from 'react';
import { render, screen } from '@testing-library/react';
import { IncomeTracker } from '@/components/dashboard/IncomeTracker';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Recharts uses ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('IncomeTracker', () => {
  it('renders the section title and subtitle', () => {
    render(<IncomeTracker />);
    expect(screen.getByText('Rental Income')).toBeInTheDocument();
    expect(
      screen.getByText('Monthly income from all properties'),
    ).toBeInTheDocument();
  });

  it('aggregates and renders the latest month income', () => {
    render(<IncomeTracker />);
    // Latest month (Jan) income is 18240 from the static fixture.
    expect(screen.getByText('$18,240')).toBeInTheDocument();
  });

  it('aggregates and renders the 6-month average income', () => {
    render(<IncomeTracker />);
    // (15200 + 16800 + 17500 + 16200 + 18900 + 18240) / 6 = 17140
    expect(screen.getByText('$17,140')).toBeInTheDocument();
  });

  it('renders the month-over-month change percentage', () => {
    render(<IncomeTracker />);
    // ((18240 - 18900) / 18900) * 100 = -3.5 (rounded to one decimal)
    expect(screen.getByText(/-3\.5%/)).toBeInTheDocument();
  });

  it('renders the chart legend with actual and projected labels', () => {
    render(<IncomeTracker />);
    expect(screen.getByText('Actual Income')).toBeInTheDocument();
    expect(screen.getByText('Projected')).toBeInTheDocument();
  });

  it('renders a chart container with the income bar chart', () => {
    const { container } = render(<IncomeTracker />);
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull();
  });
});
