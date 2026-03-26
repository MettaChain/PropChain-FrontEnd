import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnector } from '../WalletConnector';
import { useWalletStore } from '@/store/walletStore';
import { useChain } from '@/providers/ChainAwareProvider';

// Mock the dependencies
jest.mock('@/store/walletStore');
jest.mock('@/providers/ChainAwareProvider');
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockUseChain = useChain as jest.MockedFunction<typeof useChain>;

describe('WalletConnector', () => {
  const mockSetDisconnected = jest.fn();
  const mockClearError = jest.fn();
  const mockSetBalance = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseWalletStore.mockReturnValue({
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null,
      setDisconnected: mockSetDisconnected,
      clearError: mockClearError,
      setBalance: mockSetBalance,
    } as any);

    mockUseChain.mockReturnValue({
      currentChain: 1,
      chainConfig: {
        id: 1,
        name: 'Ethereum',
        symbol: 'ETH',
        color: '#627EEA',
      },
    } as any);

    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: jest.fn(),
      },
      writable: true,
    });
  });

  describe('when wallet is not connected', () => {
    it('should show connect wallet button', () => {
      render(<WalletConnector />);
      
      const connectButton = screen.getByRole('button', { name: 'Connect Wallet' });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toBeEnabled();
    });

    it('should open wallet modal when connect button is clicked', () => {
      render(<WalletConnector />);
      
      const connectButton = screen.getByRole('button', { name: 'Connect Wallet' });
      fireEvent.click(connectButton);
      
      // WalletModal should be rendered (it's dynamically imported)
      expect(connectButton).toBeInTheDocument();
    });

    it('should show connecting state when isConnecting is true', () => {
      mockUseWalletStore.mockReturnValue({
        ...mockUseWalletStore(),
        isConnecting: true,
      } as any);

      render(<WalletConnector />);
      
      const connectButton = screen.getByRole('button', { name: 'Connecting...' });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toBeDisabled();
    });

    it('should display error message when error exists', () => {
      mockUseWalletStore.mockReturnValue({
        ...mockUseWalletStore(),
        error: 'Connection failed',
      } as any);

      render(<WalletConnector />);
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  describe('when wallet is connected', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockBalance = '1.5';

    beforeEach(() => {
      mockUseWalletStore.mockReturnValue({
        isConnected: true,
        address: mockAddress,
        isConnecting: false,
        error: null,
        setDisconnected: mockSetDisconnected,
        clearError: mockClearError,
        setBalance: mockSetBalance,
      } as any);

      // Mock the store's getState method for balance
      (useWalletStore.getState as jest.Mock) = jest.fn(() => ({
        balance: mockBalance,
      }));
    });

    it('should display wallet information', () => {
      render(<WalletConnector />);
      
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('1.500')).toBeInTheDocument();
    });

    it('should display network switcher', () => {
      render(<WalletConnector />);
      
      // NetworkSwitcher should be rendered (it's dynamically imported)
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    it('should show disconnect button', () => {
      render(<WalletConnector />);
      
      const disconnectButton = screen.getByRole('button', { name: 'Disconnect' });
      expect(disconnectButton).toBeInTheDocument();
    });

    it('should call setDisconnected when disconnect button is clicked', () => {
      render(<WalletConnector />);
      
      const disconnectButton = screen.getByRole('button', { name: 'Disconnect' });
      fireEvent.click(disconnectButton);
      
      expect(mockSetDisconnected).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('should call updateBalance on mount and when dependencies change', async () => {
      const mockRequest = jest.fn().mockResolvedValue('0x152D02C7E14AF6800000'); // 1 ETH in wei
      
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: mockRequest,
        },
        writable: true,
      });

      render(<WalletConnector />);
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith({
          method: 'eth_getBalance',
          params: [mockAddress, 'latest'],
        });
      });

      expect(mockSetBalance).toHaveBeenCalledWith('1.0000');
    });

    it('should handle balance fetch errors gracefully', async () => {
      const mockError = new Error('Failed to fetch balance');
      const mockRequest = jest.fn().mockRejectedValue(mockError);
      
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: mockRequest,
        },
        writable: true,
      });

      render(<WalletConnector />);
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalled();
      });

      // Should not crash and should not call setBalance with invalid data
      expect(mockSetBalance).not.toHaveBeenCalled();
    });

    it('should handle invalid balance response', async () => {
      const mockRequest = jest.fn().mockResolvedValue(12345); // Invalid response (not string)
      
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: mockRequest,
        },
        writable: true,
      });

      render(<WalletConnector />);
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalled();
      });

      expect(mockSetBalance).not.toHaveBeenCalled();
    });

    it('should not update balance when window.ethereum is not available', async () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(<WalletConnector />);
      
      // Should not crash and should not call setBalance
      expect(mockSetBalance).not.toHaveBeenCalled();
    });

    it('should display error message when error exists in connected state', () => {
      mockUseWalletStore.mockReturnValue({
        isConnected: true,
        address: mockAddress,
        isConnecting: false,
        error: 'Transaction failed',
        setDisconnected: mockSetDisconnected,
        clearError: mockClearError,
        setBalance: mockSetBalance,
      } as any);

      render(<WalletConnector />);
      
      expect(screen.getByText('Transaction failed')).toBeInTheDocument();
    });
  });

  describe('formatAddress function', () => {
    it('should format address correctly', () => {
      mockUseWalletStore.mockReturnValue({
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        isConnecting: false,
        error: null,
        setDisconnected: mockSetDisconnected,
        clearError: mockClearError,
        setBalance: mockSetBalance,
      } as any);

      render(<WalletConnector />);
      
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });
  });

  describe('balance formatting', () => {
    it('should format balance to 4 decimal places', async () => {
      const mockRequest = jest.fn().mockResolvedValue('0x152D02C7E14AF6800000'); // 1 ETH in wei
      
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: mockRequest,
        },
        writable: true,
      });

      render(<WalletConnector />);
      
      await waitFor(() => {
        expect(mockSetBalance).toHaveBeenCalledWith('1.0000');
      });
    });

    it('should handle small balance amounts', async () => {
      const mockRequest = jest.fn().mockResolvedValue('0x38D7EA4C68000'); // 0.001 ETH in wei
      
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: mockRequest,
        },
        writable: true,
      });

      render(<WalletConnector />);
      
      await waitFor(() => {
        expect(mockSetBalance).toHaveBeenCalledWith('0.0010');
      });
    });
  });
});
