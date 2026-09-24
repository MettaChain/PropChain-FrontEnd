import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletModal } from '@/components/WalletModal';
import { useWalletStore } from '@/store/walletStore';
import { useSecurity } from '@/hooks/useSecurity';
import { useWalletConnector } from '@/hooks/useWalletConnector';

jest.mock('@/store/walletStore');
jest.mock('@/hooks/useSecurity');
jest.mock('@/hooks/useWalletConnector');
jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
jest.mock('@/components/PageTransition', () => ({
  ModalTransition: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

const connectWallet = jest.fn().mockResolvedValue({ address: '0xabc', chainId: 1 });
const validateWalletConnection = jest.fn();

describe('WalletModal blocked security validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectWallet.mockResolvedValue({ address: '0xabc', chainId: 1 });
    (useWalletStore as jest.Mock).mockReturnValue({
      setConnecting: jest.fn(), setConnected: jest.fn(), setError: jest.fn(), error: null,
    });
    (useSecurity as jest.Mock).mockReturnValue({ validateWalletConnection });
    (useWalletConnector as jest.Mock).mockReturnValue({ connectWallet, isLoadingConnector: false });
  });

  it('prevents connection and shows an accessible error when validation is blocked', async () => {
    validateWalletConnection.mockResolvedValue({ isValid: false, warnings: [], blocks: ['Address is blacklisted'] });
    render(<WalletModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText('MetaMask').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Connection Blocked')).toBeInTheDocument();
      expect(screen.getByText(/Address is blacklisted/)).toBeInTheDocument();
    });
  });

  it('proceeds to connect when validation passes', async () => {
    validateWalletConnection.mockResolvedValue({ isValid: true, warnings: [], blocks: [] });
    const onClose = jest.fn();
    render(<WalletModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('MetaMask').closest('button')!);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
