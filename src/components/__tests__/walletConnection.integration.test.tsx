import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletConnector } from '../WalletConnector';
import { WalletModal } from '../WalletModal';
import { useWalletStore } from '@/store/walletStore';
import { useSecurity } from '@/hooks/useSecurity';
import { getWalletErrorMessage } from '@/utils/errorHandling';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: false,
    isConnecting: false,
  }),
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [
      { id: 'metaMask', name: 'MetaMask' },
      { id: 'walletConnect', name: 'WalletConnect' },
      { id: 'coinbaseWallet', name: 'Coinbase Wallet' },
    ],
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useChainId: () => ({ chainId: 1 }),
  useSwitchChain: () => ({
    switchChain: jest.fn(),
  }),
}));

// Mock security hook
jest.mock('@/hooks/useSecurity', () => ({
  useSecurity: () => ({
    validateWalletConnection: jest.fn().mockResolvedValue({
      isValid: true,
      warnings: [],
      blocks: [],
    }),
  }),
}));

// Mock error handling
jest.mock('@/utils/errorHandling', () => ({
  getWalletErrorMessage: (error: any) => error?.message || 'Unknown error',
}));

// Mock chain provider
jest.mock('@/providers/ChainAwareProvider', () => ({
  useChain: () => ({
    currentChain: { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
    chainConfig: { symbol: 'ETH', color: '#627EEA' },
  }),
}));

// Create test providers
const createTestProviders = (children: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider client={{} as any}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
};

describe('Wallet Connection Integration Tests', () => {
  beforeEach(() => {
    // Reset wallet store before each test
    useWalletStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Connect MetaMask successfully', () => {
    it('should connect MetaMask wallet successfully', async () => {
      const user = userEvent.setup();
      
      // Mock successful MetaMask connection
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x1') // eth_chainId
          .mockResolvedValue('0x56bc75e2d630eb2240e8220ec3f8b5d8a5d8f1c9'), // eth_getBalance
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();

      await user.click(connectButton);

      // Wallet modal should open
      const modalTitle = screen.getByRole('heading', { name: /connect wallet/i });
      expect(modalTitle).toBeInTheDocument();

      // Click MetaMask option
      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Wait for connection to complete
      await waitFor(() => {
        expect(screen.queryByText(/connect wallet/i)).not.toBeInTheDocument();
      });

      // Should show connected state
      expect(screen.getByText(/0x1234\.\.\.7890/i)).toBeInTheDocument();
      expect(screen.getByText(/disconnect/i)).toBeInTheDocument();
    });
  });

  describe('Handle user rejection', () => {
    it('should handle MetaMask user rejection gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock MetaMask rejection (error code 4001)
      const mockEthereum = {
        request: jest.fn().mockRejectedValue({ code: 4001 }),
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => false),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click MetaMask option
      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/user rejected the connection request/i)).toBeInTheDocument();
      });

      // Connect button should still be visible
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
  });

  describe('Handle network mismatch', () => {
    it('should handle unsupported network', async () => {
      const user = userEvent.setup();
      
      // Mock connection to unsupported network
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x999'), // Unsupported chain ID
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click MetaMask option
      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/unsupported network/i)).toBeInTheDocument();
      });
    });
  });

  describe('Disconnect wallet', () => {
    it('should disconnect wallet successfully', async () => {
      const user = userEvent.setup();
      
      // Mock connected wallet
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x1') // eth_chainId
          .mockResolvedValue('0x56bc75e2d630eb2240e8220ec3f8b5d8a5d8f1c9'), // eth_getBalance
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      // Set initial connected state
      useWalletStore.getState().setConnected('0x1234567890123456789012345678901234567890', 'metamask', 1);

      render(createTestProviders(<WalletConnector />));

      // Should show connected state
      expect(screen.getByText(/0x1234\.\.\.7890/i)).toBeInTheDocument();

      // Click disconnect button
      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      await user.click(disconnectButton);

      // Should return to disconnected state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
      });

      expect(screen.queryByText(/0x1234\.\.\.7890/i)).not.toBeInTheDocument();
    });
  });

  describe('Wallet state persisted across renders', () => {
    it('should persist wallet state across component re-renders', async () => {
      const user = userEvent.setup();
      
      // Mock successful MetaMask connection
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x1') // eth_chainId
          .mockResolvedValue('0x56bc75e2d630eb2240e8220ec3f8b5d8a5d8f1c9'), // eth_getBalance
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      const { rerender } = render(createTestProviders(<WalletConnector />));

      // Connect wallet
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Wait for connection
      await waitFor(() => {
        expect(screen.getByText(/0x1234\.\.\.7890/i)).toBeInTheDocument();
      });

      // Re-render component
      rerender(createTestProviders(<WalletConnector />));

      // State should be preserved
      expect(screen.getByText(/0x1234\.\.\.7890/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });
  });

  describe('Coinbase Wallet connection', () => {
    it('should connect Coinbase Wallet successfully', async () => {
      const user = userEvent.setup();
      
      // Mock Coinbase Wallet
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x1') // eth_chainId
          .mockResolvedValue('0x56bc75e2d630eb2240e8220ec3f8b5d8a5d8f1c9'), // eth_getBalance
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isCoinbaseWallet: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click Coinbase Wallet option
      const coinbaseButton = screen.getByRole('button', { name: /coinbase wallet/i });
      await user.click(coinbaseButton);

      // Wait for connection to complete
      await waitFor(() => {
        expect(screen.getByText(/0x1234\.\.\.7890/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security validation', () => {
    it('should handle security validation failure', async () => {
      const user = userEvent.setup();
      
      // Mock security validation failure
      const mockValidateWalletConnection = jest.fn().mockResolvedValue({
        isValid: false,
        warnings: ['Suspicious activity detected'],
        blocks: ['Address is blacklisted'],
      });

      jest.mocked(useSecurity).mockReturnValue({
        validateWalletConnection: mockValidateWalletConnection,
      } as any);

      // Mock successful MetaMask connection
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x1'), // eth_chainId
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click MetaMask option
      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Should show security validation error
      await waitFor(() => {
        expect(screen.getByText(/address is blacklisted/i)).toBeInTheDocument();
      });

      // Should not connect
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
  });

  describe('Wallet not installed', () => {
    it('should handle MetaMask not installed', async () => {
      const user = userEvent.setup();
      
      // Mock no wallet installed
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click MetaMask option
      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/metamask is not installed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Balance fetching', () => {
    it('should fetch and display wallet balance', async () => {
      const user = userEvent.setup();
      
      // Mock successful connection and balance
      const mockEthereum = {
        request: jest.fn()
          .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']) // eth_requestAccounts
          .mockResolvedValueOnce('0x1') // eth_chainId
          .mockResolvedValue('0x56bc75e2d630eb2240e8220ec3f8b5d8a5d8f1c9'), // eth_getBalance (1.5 ETH)
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(createTestProviders(<WalletConnector />));

      // Connect wallet
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Wait for connection and balance
      await waitFor(() => {
        expect(screen.getByText(/1\.5/i)).toBeInTheDocument(); // Balance display
      });

      expect(screen.getByText(/eth/i)).toBeInTheDocument(); // Chain symbol
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button to open modal
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Modal should be open
      expect(screen.getByRole('heading', { name: /connect wallet/i })).toBeInTheDocument();

      // Click outside modal (backdrop)
      const backdrop = screen.getByText(''); // The backdrop div
      await user.click(backdrop);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /connect wallet/i })).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();
      
      render(createTestProviders(<WalletConnector />));

      // Click connect wallet button to open modal
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click close button
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /connect wallet/i })).not.toBeInTheDocument();
      });
    });
  });
});
