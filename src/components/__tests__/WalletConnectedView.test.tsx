import { render, screen, fireEvent } from '@testing-library/react';
import { WalletConnectedView } from '../WalletConnectedView';
import { useWalletStore } from '@/store/walletStore';
import { useKycStore } from '@/store/kycStore';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: () => Promise<{ [key: string]: React.ComponentType<any> }>) => {
    const DynamicComponent = ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="dynamic-component">{children}</div>
    );
    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  },
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

jest.mock('@/store/kycStore', () => ({
  useKycStore: jest.fn(),
}));

jest.mock('@/providers/ChainAwareProvider', () => ({
  useChain: () => ({
    currentChain: { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
    chainConfig: { symbol: 'ETH', color: '#627EEA' },
  }),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@/components/kyc/KycStatusBadge', () => ({
  KycStatusBadge: ({ status, compact }: { status: string; compact?: boolean }) => (
    <div data-testid="kyc-badge" data-status={status} data-compact={compact ? 'true' : 'false'}>
      KYC: {status}
    </div>
  ),
}));

jest.mock('@/utils/walletHelpers', () => ({
  formatAddress: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`,
  formatBalanceForDisplay: (balance: string, decimals: number = 3) =>
    parseFloat(balance).toFixed(decimals),
  disconnectWallet: jest.fn(),
}));

// ============================================================================
// Helpers
// ============================================================================

const mockWalletStore = (overrides = {}) => {
  const defaultStore = {
    setDisconnected: jest.fn(),
    clearError: jest.fn(),
    balance: null,
    error: null,
  };
  (useWalletStore as unknown as jest.Mock).mockReturnValue({
    ...defaultStore,
    ...overrides,
  });
};

const mockKycStore = (overrides = {}) => {
  const defaultStore = {
    profile: { status: 'unverified', thresholdEth: 10000 },
  };
  (useKycStore as unknown as jest.Mock).mockReturnValue({
    ...defaultStore,
    ...overrides,
  });
};

// ============================================================================
// Tests
// ============================================================================

describe('WalletConnectedView', () => {
  const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletStore();
    mockKycStore();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders the truncated wallet address', () => {
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
  });

  it('renders the chain symbol (ETH)', () => {
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('renders the KYC badge', () => {
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByTestId('kyc-badge')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-badge')).toHaveAttribute('data-status', 'unverified');
  });

  it('renders the disconnect button', () => {
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('calls disconnectWallet when disconnect button is clicked', () => {
    const { disconnectWallet } = require('@/utils/walletHelpers');
    render(<WalletConnectedView address={testAddress} />);

    fireEvent.click(screen.getByText('Disconnect'));
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
  });

  it('displays the balance when available', () => {
    mockWalletStore({ balance: '1.5' });
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByText('1.500')).toBeInTheDocument();
  });

  it('displays a skeleton when balance is not available', () => {
    mockWalletStore({ balance: null });
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    mockWalletStore({ error: 'Connection failed' });
    render(<WalletConnectedView address={testAddress} />);
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('copies address to clipboard when copy button is clicked', () => {
    render(<WalletConnectedView address={testAddress} />);

    const copyButton = screen.getByTitle('Copy wallet address');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testAddress);
  });
});
