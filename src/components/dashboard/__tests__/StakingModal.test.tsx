import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StakingModal } from '../StakingModal';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const onClose = jest.fn();
const mockToken = {
  id: '1',
  name: 'Manhattan Tower Suite',
  symbol: 'MTS',
  amount: 500,
  apy: 12.5,
};

describe('StakingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render content when closed', () => {
    render(<StakingModal isOpen={false} onClose={onClose} type="stake" />);

    expect(screen.queryByText('Stake Property Tokens')).not.toBeInTheDocument();
  });

  it('renders the stake input step when opened', () => {
    render(<StakingModal isOpen onClose={onClose} type="stake" />);

    expect(screen.getByText('Stake Property Tokens')).toBeInTheDocument();
    expect(screen.getByLabelText(/amount to stake/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review staking/i })).toBeInTheDocument();
  });

  it('blocks confirm when the amount is empty or invalid', () => {
    render(<StakingModal isOpen onClose={onClose} type="stake" />);

    const reviewButton = screen.getByRole('button', { name: /review staking/i });

    // Empty amount
    fireEvent.click(reviewButton);
    expect(toast.error).toHaveBeenCalledWith('Please enter a valid amount');
    expect(screen.getByText('Stake Property Tokens')).toBeInTheDocument();

    // Non-positive amount
    fireEvent.change(screen.getByLabelText(/amount to stake/i), { target: { value: '0' } });
    fireEvent.click(reviewButton);
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Confirm Stake')).not.toBeInTheDocument();
  });

  it('gates the confirm step until a valid amount is entered, then completes the stake', async () => {
    jest.useFakeTimers();
    render(<StakingModal isOpen onClose={onClose} type="stake" />);

    fireEvent.change(screen.getByLabelText(/amount to stake/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /review staking/i }));

    // Confirm step shows the entered amount
    expect(screen.getByText('Confirm Stake')).toBeInTheDocument();
    expect(screen.getByText('100 MTS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm & stake/i }));
    expect(screen.getByText('Confirming...')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Transaction Successful!')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Staked 100 MTS successfully!');

    jest.useRealTimers();
  });

  it('supports the unstake flow with a token', async () => {
    jest.useFakeTimers();
    render(<StakingModal isOpen onClose={onClose} type="unstake" token={mockToken} />);

    expect(screen.getByText('Unstake Property Tokens')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/amount to unstake/i), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /review withdrawal/i }));

    expect(screen.getByText('Confirm Unstake')).toBeInTheDocument();
    expect(screen.getByText('50 MTS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm & withdraw/i }));

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Transaction Successful!')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Unstaked 50 MTS successfully!');

    jest.useRealTimers();
  });

  it('goes back from the confirm step to edit the amount', () => {
    render(<StakingModal isOpen onClose={onClose} type="stake" />);

    fireEvent.change(screen.getByLabelText(/amount to stake/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /review staking/i }));
    expect(screen.getByText('Confirm Stake')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Stake Property Tokens')).toBeInTheDocument();
  });

  it('calls onClose when cancelled', () => {
    render(<StakingModal isOpen onClose={onClose} type="stake" />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
