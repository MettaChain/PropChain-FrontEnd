import { render, screen, fireEvent } from '@testing-library/react';
import { WalletDisconnectedView } from '../WalletDisconnectedView';
import { useWalletStore } from '@/store/walletStore';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: () => Promise<{ [key: string]: React.ComponentType<any> }>) => {
    // Return a simple mock component that renders nothing by default
    const DynamicComponent = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) =>
      isOpen ? (
        <div data-testid="wallet-modal">
          <button onClick={onClose}>Close Modal</button>
        </div>
      ) : null;
    DynamicComponent.displayName = 'DynamicModal';
    return DynamicComponent;
  },
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// ============================================================================
// Helpers
// ============================================================================

const mockWalletStore = (overrides = {}) => {
  const defaultStore = {
    isConnecting: false,
    error: null,
  };
  (useWalletStore as unknown as jest.Mock).mockReturnValue({
    ...defaultStore,
    ...overrides,
  });
};

// ============================================================================
// Tests
// ============================================================================

describe('WalletDisconnectedView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletStore();
  });

  it('renders the connect wallet button', () => {
    render(<WalletDisconnectedView />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('opens the wallet modal when connect button is clicked', () => {
    render(<WalletDisconnectedView />);

    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);

    expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
  });

  it('closes the wallet modal when close is triggered', () => {
    render(<WalletDisconnectedView />);

    // Open modal
    fireEvent.click(screen.getByText('Connect Wallet'));
    expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('wallet-modal')).not.toBeInTheDocument();
  });

  it('disables the connect button when connecting', () => {
    mockWalletStore({ isConnecting: true });
    render(<WalletDisconnectedView />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows connecting state with skeletons when connecting', () => {
    mockWalletStore({ isConnecting: true });
    render(<WalletDisconnectedView />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBe(2);
  });

  it('displays error message when there is an error', () => {
    mockWalletStore({ error: 'Connection rejected' });
    render(<WalletDisconnectedView />);

    expect(screen.getByText('Connection rejected')).toBeInTheDocument();
  });

  it('has the data-tour attribute for onboarding', () => {
    render(<WalletDisconnectedView />);
    const button = screen.getByText('Connect Wallet');
    expect(button).toHaveAttribute('data-tour', 'wallet-connector');
  });

  it('does not show error when there is no error', () => {
    render(<WalletDisconnectedView />);
    expect(screen.queryByText(/Connection rejected/)).not.toBeInTheDocument();
  });
});
