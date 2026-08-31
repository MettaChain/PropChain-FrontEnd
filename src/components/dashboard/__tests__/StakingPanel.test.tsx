import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StakingPanel } from '../StakingPanel';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Recharts ResponsiveContainer warns about 0x0 dimensions in jsdom and
// renders nothing useful there; stub it out for panel behavior tests.
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe('StakingPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the staking stats', () => {
    render(<StakingPanel />);

    expect(screen.getByText('Total Staked Value')).toBeInTheDocument();
    expect(screen.getByText('$350,000')).toBeInTheDocument();
    expect(screen.getByText('Pending Rewards')).toBeInTheDocument();
    expect(screen.getByText('$17.57')).toBeInTheDocument();
    expect(screen.getByText('Active Stakes')).toBeInTheDocument();
  });

  it('renders the active stakes list', () => {
    render(<StakingPanel />);

    expect(screen.getByText('Your Active Stakes')).toBeInTheDocument();
    expect(screen.getByText('Manhattan Tower Suite')).toBeInTheDocument();
    expect(screen.getByText('Sunset Beach Villa')).toBeInTheDocument();
  });

  it('opens the stake modal when New Stake is clicked', () => {
    render(<StakingPanel />);

    fireEvent.click(screen.getByRole('button', { name: /new stake/i }));

    expect(screen.getByText('Stake Property Tokens')).toBeInTheDocument();
  });

  it('opens the unstake modal with the selected token', () => {
    render(<StakingPanel />);

    fireEvent.click(screen.getAllByRole('button', { name: /^unstake$/i })[0]);

    expect(screen.getByText('Unstake Property Tokens')).toBeInTheDocument();
  });

  it('claims all rewards with a toast', () => {
    render(<StakingPanel />);

    fireEvent.click(screen.getByRole('button', { name: /claim all/i }));

    expect(toast.success).toHaveBeenCalledWith(
      'Claiming rewards for all tokens...',
      expect.objectContaining({ description: 'Estimated gas cost: 0.0012 ETH' })
    );
  });

  it('claims rewards for an individual stake', () => {
    render(<StakingPanel />);

    fireEvent.click(screen.getAllByRole('button', { name: /^claim$/i })[0]);

    expect(toast.success).toHaveBeenCalledWith(
      'Claiming rewards for Manhattan Tower Suite...',
      expect.objectContaining({ description: 'Estimated gas cost: 0.0012 ETH' })
    );
  });
});
