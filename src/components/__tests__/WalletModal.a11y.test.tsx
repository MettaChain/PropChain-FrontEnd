import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { WalletModal } from '../WalletModal';

// Ensure the providers that WalletModal depends on don't blow up the render.
jest.mock('@/store/walletStore', () => ({
  useWalletStore: () => ({
    setConnecting: jest.fn(),
    setConnected: jest.fn(),
    setError: jest.fn(),
    error: null,
  }),
}));

jest.mock('@/hooks/useSecurity', () => ({
  useSecurity: () => ({
    validateWalletConnection: jest.fn().mockResolvedValue({
      isValid: true,
      warnings: [],
      blocks: [],
    }),
  }),
}));

jest.mock('@/hooks/useWalletConnector', () => ({
  useWalletConnector: () => ({
    connectWallet: jest.fn(),
    isLoadingConnector: false,
  }),
}));

describe('WalletModal close button accessibility (#490)', () => {
  afterEach(() => cleanup());

  it('has type="button" so it is not interpreted as submit', () => {
    render(<WalletModal isOpen onClose={jest.fn()} />);
    const closeButton = screen.getByRole('button', { name: /close wallet selector/i });
    expect(closeButton).toHaveAttribute('type', 'button');
  });

  it('exposes the accessible name "Close wallet selector"', () => {
    render(<WalletModal isOpen onClose={jest.fn()} />);
    const closeButton = screen.getByRole('button', { name: /close wallet selector/i });
    expect(closeButton).toHaveAccessibleName('Close wallet selector');
  });
});
