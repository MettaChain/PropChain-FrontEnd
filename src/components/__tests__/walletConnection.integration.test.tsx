import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletConnector } from '../WalletConnector';
import { WalletModal } from '../WalletModal';
import { useWalletStore } from '@/store/walletStore';
import { useSecurity } from '@/hooks/useSecurity';
import { getWalletErrorMessage } from '@/utils/errorHandling';
import { updateWalletBalance } from '@/utils/walletHelpers';

// Break the circular dependency chain (walletStore -> chains -> env -> logger
// -> csrfClient -> walletStore) by stubbing the chain config module.
jest.mock('@/config/chains', () => ({
  toChainId: (chainId: number) => {
    const parsed = Number(chainId) || undefined;
    // Only chain id 1 is considered supported in this test mock
    return parsed === 1 ? 1 : undefined;
  },
  getChainName: () => 'Ethereum',
  DEFAULT_CHAIN_ID: 1,
  SUPPORTED_CHAINS: [{ id: 1 }],
  DEFAULT_CHAIN: { id: 1, name: 'Ethereum' },
}));

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

// Mock next/dynamic to render lazy components via React.lazy/Suspense in tests
jest.mock('next/dynamic', () => (loader: any) => {
  const React = require('react');
  const Lazy = React.lazy(() => loader().then((loaded: any) => {
    // loader might resolve to a component or a module
    const comp = loaded && loaded.default ? loaded.default : loaded;
    return { default: comp };
  }));

  return (props: any) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props));
});

// Mock security hook
jest.mock('@/hooks/useSecurity', () => ({
  useSecurity: jest.fn(() => ({
    validateWalletConnection: jest.fn().mockResolvedValue({
      isValid: true,
      warnings: [],
      blocks: [],
    }),
  })),
}));

// Mock error handling
jest.mock('@/utils/errorHandling', () => ({
  getFriendlyWeb3ErrorMessage: (error: any) => {
    if (!error) return 'Unknown error';
    if (typeof error === 'object' && error.code === 4001) return 'User rejected the connection request';
    const message =
      error?.message || (typeof error === 'object' ? String(error.code ?? '') : String(error));
    return message || 'Unknown error';
  },
  getWalletErrorMessage: (error: any) => {
    if (!error) return 'Unknown error';
    if (typeof error === 'object' && error.code === 4001) return 'User rejected the connection request';
    if (typeof error === 'object' && error.code === 4902) return 'Unsupported network';
    const message =
      error?.message || (typeof error === 'object' ? String(error.code ?? '') : String(error));
    if (/MetaMask is not installed/i.test(message)) return 'MetaMask is not installed. Please install MetaMask to continue.';
    if (/Unsupported network/i.test(message)) return 'Unsupported network';
    return message || 'Unknown error';
  },
}));

// Mock the viem public client so wallet-balance fetching does not attempt a
// real RPC call (which is unavailable in the jsdom test environment).
jest.mock('@/lib/viem-client', () => ({
  publicClient: {
    getBalance: jest.fn().mockResolvedValue(1500000000000000000n), // 1.5 ETH
  },
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

// Simple test connector that bypasses next/dynamic and renders WalletModal synchronously
const TestConnector: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isConnecting, isConnected, address, balance, setDisconnected } = useWalletStore();

  // Fetch wallet balance when connected (mirrors the real WalletConnector)
  React.useEffect(() => {
    if (isConnected && address) {
      updateWalletBalance(window.ethereum, address, useWalletStore.getState().setBalance);
    }
  }, [isConnected, address]);

  const displayAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex items-center justify-center gap-3">
      {isConnected && address ? (
        <>
          <span>{displayAddress(address)}</span>
          {balance && <span>{balance} ETH</span>}
          <button type="button" onClick={() => setDisconnected()}>
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          disabled={isConnecting}
          data-tour="wallet-connector"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      <WalletModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

describe('Wallet Connection Integration Tests', () => {
  beforeEach(() => {
    // Reset wallet store before each test
    useWalletStore.getState().reset();
    jest.clearAllMocks();
    // Reset the security mock to its default (valid) return value so an
    // override made in one test does not leak into subsequent tests.
    (useSecurity as unknown as jest.Mock).mockReturnValue({
      validateWalletConnection: jest.fn().mockResolvedValue({
        isValid: true,
        warnings: [],
        blocks: [],
      }),
    });
  });

  afterEach(() => {
    cleanup();
    // Remove any leftover Radix Dialog portal nodes and body-level styles that
    // can leak between tests and keep a modal "open" in the next test.
    document.body.innerHTML = '';
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
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

      render(createTestProviders(<TestConnector />));

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

      render(createTestProviders(<TestConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click MetaMask option
      const metaMaskButton = screen.getByRole('button', { name: /metamask/i });
      await user.click(metaMaskButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/you rejected the connection request/i)).toBeInTheDocument();
      });

      // Connect modal should still be open so the user can retry
      expect(screen.getByRole('dialog')).toBeInTheDocument();
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

      render(createTestProviders(<TestConnector />));

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

      render(createTestProviders(<TestConnector />));

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

      const { rerender } = render(createTestProviders(<TestConnector />));

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

      render(createTestProviders(<TestConnector />));

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

      (useSecurity as unknown as jest.Mock).mockReturnValue({
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

      render(createTestProviders(<TestConnector />));

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

      // Should not connect - the connect modal stays open so the user can retry
      expect(screen.getByRole('dialog')).toBeInTheDocument();
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

      render(createTestProviders(<TestConnector />));

      // Click connect wallet button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // MetaMask is not presented as a connectable option when not installed
      expect(screen.queryByRole('button', { name: /metamask/i })).not.toBeInTheDocument();

      // Instead the modal shows an install prompt for MetaMask
      expect(screen.getAllByText(/MetaMask/i).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /install/i }).length).toBeGreaterThan(0);
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

      render(createTestProviders(<TestConnector />));

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

      render(createTestProviders(<TestConnector />));

      // Click connect wallet button to open modal
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Modal should be open
      expect(screen.getByRole('heading', { name: /connect wallet/i })).toBeInTheDocument();

      // Click outside modal (backdrop overlay)
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).not.toBeNull();
      await user.click(overlay as Element);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /connect wallet/i })).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();

      render(createTestProviders(<TestConnector />));

      // Click connect wallet button to open modal
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close wallet selector/i });
      await user.click(closeButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /connect wallet/i })).not.toBeInTheDocument();
      });
    });
  });
});
