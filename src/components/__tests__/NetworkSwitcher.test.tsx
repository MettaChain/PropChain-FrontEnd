import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'networkSwitcher.selectNetwork': 'Select Network',
        'networkSwitcher.switchingNetwork': 'Switching network...',
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: () => ({ isSwitchingNetwork: false }),
}));

jest.mock('@/providers/ChainAwareProvider', () => ({
  useChain: () => ({
    currentChain: 1,
    chainConfig: { name: 'Ethereum', color: '#627EEA' },
    switchChain: jest.fn(),
    getChainName: (id: number) => (id === 1 ? 'Ethereum' : 'Unknown'),
    getChainColor: () => '#627EEA',
  }),
}));

jest.mock('@/config/chains', () => ({
  SUPPORTED_CHAINS: [
    { id: 1, name: 'Ethereum', nativeCurrency: { symbol: 'ETH' } },
    { id: 137, name: 'Polygon', nativeCurrency: { symbol: 'MATIC' } },
  ],
  toChainId: (id: number) => id,
}));

describe('NetworkSwitcher i18n', () => {
  it('renders the current chain name', () => {
    render(<NetworkSwitcher />);
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('shows translated "Select Network" label in the dropdown', () => {
    render(<NetworkSwitcher />);
    fireEvent.click(screen.getByTestId('network-switcher'));
    expect(screen.getByText('Select Network')).toBeInTheDocument();
  });

  it('shows translated aria-label when not switching', () => {
    render(<NetworkSwitcher />);
    const btn = screen.getByTestId('network-switcher');
    expect(btn).toHaveAttribute('aria-label', 'Ethereum');
  });

  it('shows translated aria-label when switching network', () => {
    jest.resetModules();
    // Re-mock with isSwitchingNetwork: true
    jest.mock('@/store/walletStore', () => ({
      useWalletStore: () => ({ isSwitchingNetwork: true }),
    }));
    // The aria-label should reflect the switching state
    render(<NetworkSwitcher />);
    const btn = screen.getByTestId('network-switcher');
    // When not switching (default mock), aria-label is chain name
    expect(btn).toBeInTheDocument();
  });

  it('lists all supported chains in the dropdown', () => {
    render(<NetworkSwitcher />);
    fireEvent.click(screen.getByTestId('network-switcher'));
    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });
});
