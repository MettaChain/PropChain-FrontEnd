import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';

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

describe('PerformanceChart', () => {
  it('renders the title and subtitle', () => {
    render(<PerformanceChart />);
    expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
    expect(
      screen.getByText('Track your investment growth over time'),
    ).toBeInTheDocument();
  });

  it('renders all timeframe buttons with 1Y active by default', () => {
    render(<PerformanceChart />);

    for (const label of ['7D', '30D', '90D', '1Y', 'All']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByRole('button', { name: '1Y' })).toHaveClass('bg-primary');
  });

  it('renders a chart with a descriptive aria-label for the active timeframe', () => {
    const { container } = render(<PerformanceChart />);
    const chartEl = container.querySelector('[role="img"][aria-label]');
    expect(chartEl).not.toBeNull();
    expect(chartEl!.getAttribute('aria-label')).toMatch(/portfolio performance over 1Y/i);
  });

  it('includes the latest derived value in the chart aria-label', () => {
    const { container } = render(<PerformanceChart />);
    const chartEl = container.querySelector('[role="img"][aria-label]');
    expect(chartEl!.getAttribute('aria-label')).toMatch(/latest value: \$/i);
  });

  it('switches the active timeframe and re-derives the chart data', () => {
    const { container } = render(<PerformanceChart />);

    fireEvent.click(screen.getByRole('button', { name: '7D' }));

    const chartEl = container.querySelector('[role="img"][aria-label]');
    expect(chartEl!.getAttribute('aria-label')).toMatch(/portfolio performance over 7D/i);
    expect(screen.getByRole('button', { name: '7D' })).toHaveClass('bg-primary');
  });

  it('renders the legend with actual and projected labels', () => {
    render(<PerformanceChart />);
    expect(screen.getByText('Actual Value')).toBeInTheDocument();
    expect(screen.getByText('Projected')).toBeInTheDocument();
  });
});
