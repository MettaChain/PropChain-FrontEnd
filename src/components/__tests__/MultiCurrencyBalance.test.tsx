import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiCurrencyBalance } from '@/components/MultiCurrencyBalance';

jest.mock('@/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

jest.mock('@/providers/ChainAwareProvider', () => ({
  useChain: jest.fn(),
}));

const { useWalletStore } = jest.requireMock('@/store/walletStore') as {
  useWalletStore: jest.Mock;
};

const { useChain } = jest.requireMock('@/providers/ChainAwareProvider') as {
  useChain: jest.Mock;
};

describe('MultiCurrencyBalance', () => {
  beforeEach(() => {
    useChain.mockReset();
    useWalletStore.mockReset();
  });

  it('renders nothing when wallet is not connected', () => {
    useChain.mockReturnValue({
      chainConfig: { symbol: 'ETH', name: 'Ethereum' },
    });
    useWalletStore.mockReturnValue({ balance: null, address: null, chainId: 1 });
    const { container } = render(<MultiCurrencyBalance />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows native balance by default and can switch to USD display', async () => {
    useChain.mockReturnValue({
      chainConfig: { symbol: 'MATIC', name: 'Polygon' },
    });
    useWalletStore.mockReturnValue({
      balance: '1.25',
      address: '0xabc',
      chainId: 137,
    });

    render(<MultiCurrencyBalance />);

    // Opens dropdown
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Wallet Balance/i)).toBeInTheDocument();

    // Switch to USD mode
    fireEvent.click(screen.getByRole('button', { name: 'USD' }));

    await waitFor(() => {
      expect(screen.getAllByText('$1.06')[0]).toBeInTheDocument();
    });
  });

  it('includes extra token balances on Ethereum mainnet', async () => {
    useChain.mockReturnValue({
      chainConfig: { symbol: 'ETH', name: 'Ethereum' },
    });
    useWalletStore.mockReturnValue({
      balance: '2',
      address: '0xabc',
      chainId: 1,
    });

    render(<MultiCurrencyBalance />);

    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Token Balances/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('2 ETH').length).toBeGreaterThan(0);
      expect(screen.getByText(/150\.00 USDT/)).toBeInTheDocument();
      expect(screen.getByText(/250\.00 USDC/)).toBeInTheDocument();
    });
  });

  it('shows low balance indicator and warning when native balance is low', async () => {
    useChain.mockReturnValue({
      chainConfig: { symbol: 'ETH', name: 'Ethereum' },
    });
    useWalletStore.mockReturnValue({
      balance: '0.009',
      address: '0xabc',
      chainId: 1,
    });

    render(<MultiCurrencyBalance />);

    expect(await screen.findByText(/Low balance/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Low Balance Warning/i)).toBeInTheDocument();
  });
});
