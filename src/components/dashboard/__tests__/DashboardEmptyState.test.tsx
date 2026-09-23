import { render, screen } from '@testing-library/react';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';

describe('DashboardEmptyState (#995)', () => {
  it('renders the welcome title and description', () => {
    render(<DashboardEmptyState />);

    expect(
      screen.getByRole('heading', { name: /welcome to your dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/haven't made any purchases or activity yet/i)
    ).toBeInTheDocument();
  });

  it('invokes the provided callbacks', () => {
    const onConnectWallet = jest.fn();
    const onBrowseProperties = jest.fn();
    const onTakeTour = jest.fn();

    render(
      <DashboardEmptyState
        onConnectWallet={onConnectWallet}
        onBrowseProperties={onBrowseProperties}
        onTakeTour={onTakeTour}
      />
    );

    screen.getByText('Connect Wallet').click();
    screen.getByText('Browse Properties').click();
    screen.getByText('Take a Tour').click();

    expect(onConnectWallet).toHaveBeenCalledTimes(1);
    expect(onBrowseProperties).toHaveBeenCalledTimes(1);
    expect(onTakeTour).toHaveBeenCalledTimes(1);
  });
});
