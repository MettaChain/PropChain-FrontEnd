import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WalletModal } from '@/components/WalletModal';
import { useWalletStore } from '@/store/walletStore';
import { useSecurity } from '@/hooks/useSecurity';
import { useWalletConnector } from '@/hooks/useWalletConnector';

// Mock the hooks
jest.mock('@/store/walletStore');
jest.mock('@/hooks/useSecurity');
jest.mock('@/hooks/useWalletConnector');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock PageTransition
jest.mock('@/components/PageTransition', () => ({
  ModalTransition: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

describe('WalletModal', () => {
  const mockOnClose = jest.fn();
  const mockSetConnecting = jest.fn();
  const mockSetConnected = jest.fn();
  const mockSetError = jest.fn();
  const mockValidateWalletConnection = jest.fn();
  const mockConnectWallet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useWalletStore
    (useWalletStore as jest.Mock).mockReturnValue({
      setConnecting: mockSetConnecting,
      setConnected: mockSetConnected,
      setError: mockSetError,
      error: null,
    });

    // Mock useSecurity
    (useSecurity as jest.Mock).mockReturnValue({
      validateWalletConnection: mockValidateWalletConnection,
    });

    // Mock useWalletConnector
    (useWalletConnector as jest.Mock).mockReturnValue({
      connectWallet: mockConnectWallet,
      isLoadingConnector: false,
    });

    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        isMetaMask: true,
        isCoinbaseWallet: false,
      },
      writable: true,
    });
  });

  afterEach(() => {
    mockOnClose.mockReset();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <WalletModal isOpen={false} onClose={mockOnClose} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders modal when isOpen is true', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Enhanced Security Active')).toBeInTheDocument();
    });

    it('renders all wallet options', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      expect(screen.getByText('WalletConnect')).toBeInTheDocument();
    });

    it('renders close button and calls onClose when clicked', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const backdrop = screen.getByText('Connect Wallet').closest('div')?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Wallet Detection', () => {
    it('shows installed badge for MetaMask when detected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true, isCoinbaseWallet: false },
        writable: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Installed')).toBeInTheDocument();
    });

    it('shows installed badge for Coinbase Wallet when detected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: false, isCoinbaseWallet: true },
        writable: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Installed')).toBeInTheDocument();
    });

    it('shows install link for non-installed wallets', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: false, isCoinbaseWallet: false },
        writable: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const installLinks = screen.getAllByText('Install');
      expect(installLinks.length).toBeGreaterThan(0);
    });

    it('sorts installed wallets to the top', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true, isCoinbaseWallet: true },
        writable: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const walletButtons = screen.getAllByRole('button');
      const firstWallet = walletButtons[0];
      expect(firstWallet.textContent).toContain('Installed');
    });
  });

  describe('Wallet Connection Flow', () => {
    it('initiates wallet connection when wallet button is clicked', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(mockSetConnecting).toHaveBeenCalledWith(true);
        expect(mockSetError).toHaveBeenCalledWith(null);
      });
    });

    it('shows loading state during connector loading', async () => {
      (useWalletConnector as jest.Mock).mockReturnValue({
        connectWallet: mockConnectWallet,
        isLoadingConnector: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Loading wallet connector/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during security validation', async () => {
      mockConnectWallet.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                address: '0x1234567890123456789012345678901234567890',
                chainId: 1,
              });
            }, 100);
          })
      );

      mockValidateWalletConnection.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                isValid: true,
                warnings: [],
                blocks: [],
              });
            }, 100);
          })
      );

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(
        () => {
          expect(screen.getByText(/Validating security/i)).toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it('successfully connects wallet when validation passes', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(mockSetConnected).toHaveBeenCalledWith(
          '0x1234567890123456789012345678901234567890',
          'metamask',
          1
        );
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('disables buttons while connecting', async () => {
      mockConnectWallet.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                address: '0x1234567890123456789012345678901234567890',
                chainId: 1,
              });
            }, 100);
          })
      );

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  describe('Security Validation', () => {
    it('shows security verified status when validation passes', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Security Verified')).toBeInTheDocument();
        expect(
          screen.getByText('Connection passed all security checks')
        ).toBeInTheDocument();
      });
    });

    it('shows security warnings when validation returns warnings', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: ['Warning: New wallet detected'],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Security Warnings')).toBeInTheDocument();
        expect(screen.getByText('Warning: New wallet detected')).toBeInTheDocument();
      });
    });

    it('blocks connection when validation fails', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: false,
        warnings: [],
        blocks: ['Address is blacklisted'],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Connection Blocked')).toBeInTheDocument();
        expect(screen.getByText('Address is blacklisted')).toBeInTheDocument();
        expect(mockSetConnected).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('does not connect when security validation fails', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: false,
        warnings: [],
        blocks: ['Security check failed'],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(mockSetConnected).not.toHaveBeenCalled();
        expect(mockSetError).toHaveBeenCalledWith(
          expect.stringContaining('Security validation failed')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when connection fails', async () => {
      mockConnectWallet.mockRejectedValue(
        new Error('MetaMask is not installed')
      );

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/MetaMask is not installed/i)).toBeInTheDocument();
      });
    });

    it('shows install link for MetaMask not installed error', async () => {
      mockConnectWallet.mockRejectedValue(
        new Error('MetaMask is not installed')
      );

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        const installLink = screen.getByText('Click here to install MetaMask');
        expect(installLink).toBeInTheDocument();
        expect(installLink.closest('a')).toHaveAttribute(
          'href',
          'https://metamask.io/download/'
        );
      });
    });

    it('clears previous error on new connection attempt', async () => {
      (useWalletStore as jest.Mock).mockReturnValue({
        setConnecting: mockSetConnecting,
        setConnected: mockSetConnected,
        setError: mockSetError,
        error: 'Previous error',
      });

      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(null);
      });
    });

    it('handles unsupported chain ID error', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 999, // Unsupported chain
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(
          expect.stringContaining('Unsupported network')
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles window.ethereum being undefined (SSR)', () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      // Should still render without crashing
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
    });

    it('handles all wallets not installed', () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const installLinks = screen.getAllByText('Install');
      expect(installLinks.length).toBe(2); // MetaMask and Coinbase have install links
    });

    it('resets connecting state in finally block', async () => {
      mockConnectWallet.mockRejectedValue(new Error('Connection failed'));

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button');
      if (metaMaskButton) {
        fireEvent.click(metaMaskButton);
      }

      await waitFor(() => {
        expect(mockSetConnecting).toHaveBeenCalledWith(true);
        expect(mockSetConnecting).toHaveBeenLastCalledWith(false);
      });
    });

    it('handles Coinbase Wallet connection', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
      if (coinbaseButton) {
        fireEvent.click(coinbaseButton);
      }

      await waitFor(() => {
        expect(mockConnectWallet).toHaveBeenCalledWith('coinbase');
      });
    });

    it('handles WalletConnect connection', async () => {
      mockConnectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      mockValidateWalletConnection.mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      });

      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      // WalletConnect is always available but may not be "installed"
      const walletConnectButton = screen.getByText('WalletConnect').closest('button');
      if (walletConnectButton) {
        fireEvent.click(walletConnectButton);
      }

      await waitFor(() => {
        expect(mockConnectWallet).toHaveBeenCalledWith('walletconnect');
      });
    });

    it('displays security info section', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Enhanced Security Active')).toBeInTheDocument();
      expect(
        screen.getByText(
          'All connections are validated with domain verification, phishing protection, and security checks.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('close button is accessible', () => {
      render(<WalletModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });
});
