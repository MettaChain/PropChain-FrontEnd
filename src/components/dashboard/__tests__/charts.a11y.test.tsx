import { render } from '@testing-library/react';
import { YieldChart } from '@/components/dashboard/YieldChart';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { RiskAnalysis } from '@/components/dashboard/RiskAnalysis';

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

describe('YieldChart – a11y (#499)', () => {
  it('renders a chart container with a descriptive aria-label', () => {
    const { container } = render(<YieldChart />);
    const chartEl = container.querySelector('[role="img"][aria-label]');
    expect(chartEl).not.toBeNull();
    expect(chartEl!.getAttribute('aria-label')).toMatch(/yield/i);
  });
});

describe('PerformanceChart – a11y (#499)', () => {
  it('renders a chart container with a descriptive aria-label', () => {
    const { container } = render(<PerformanceChart />);
    const chartEl = container.querySelector('[role="img"][aria-label]');
    expect(chartEl).not.toBeNull();
    expect(chartEl!.getAttribute('aria-label')).toMatch(/portfolio performance/i);
  });
});

describe('RiskAnalysis – a11y (#499)', () => {
  it('renders risk metrics group with accessible label', () => {
    const { container } = render(<RiskAnalysis />);
    const metricsGroup = container.querySelector('[role="group"][aria-label="Risk metrics"]');
    expect(metricsGroup).not.toBeNull();
  });

  it('renders concentration group with accessible label', () => {
    const { container } = render(<RiskAnalysis />);
    const concentrationGroup = container.querySelector(
      '[role="group"][aria-label="Portfolio concentration analysis"]'
    );
    expect(concentrationGroup).not.toBeNull();
  });

  it('renders overall risk score as a meter with aria attributes', () => {
    const { container } = render(<RiskAnalysis />);
    const meter = container.querySelector('[role="meter"]');
    expect(meter).not.toBeNull();
    expect(meter!.getAttribute('aria-valuenow')).toBe('32');
    expect(meter!.getAttribute('aria-valuemin')).toBe('0');
    expect(meter!.getAttribute('aria-valuemax')).toBe('100');
    expect(meter!.getAttribute('aria-label')).toMatch(/risk score/i);
  });
});
