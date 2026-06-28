import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecureTransactionConfirmation } from '../SecureTransactionConfirmation';
import { useSecureTransaction } from '@/hooks/useSecureTransaction';
import { useWalletStore } from '@/store/walletStore';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/useSecureTransaction');
jest.mock('@/store/walletStore');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock utils
jest.mock('@/utils/eip712/eip712Signing', () => ({
  validateTransactionParameters: jest.fn().mockReturnValue({
    isValid: true,
    warnings: [],
    risks: [],
  }),
}));

describe('SecureTransactionConfirmation', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const mockTransaction = {
    to: '0x1234567890123456789012345678901234567890',
    value: '1000000000000000000', // 1 ETH
    data: '0x',
  };

  const mockUseSecureTransaction = {
    signAndVerifyTransaction: jest.fn(),
    broadcastTransaction: jest.fn(),
    validateTransaction: jest.fn(),
    isSigning: false,
    isBroadcasting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSecureTransaction as jest.Mock).mockReturnValue(mockUseSecureTransaction);
    (useWalletStore as unknown as jest.Mock).mockReturnValue({
      address: '0xUserAddress',
      chainId: 1,
    });
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <SecureTransactionConfirmation
        isOpen={false}
        transaction={mockTransaction}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when open', () => {
    render(
      <SecureTransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Secure Transaction Confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/Security Assessment/i)).toBeInTheDocument();
  });

  it('shows transaction details when toggle button is clicked', () => {
    render(
      <SecureTransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Click the show details button (eye icon)
    const toggleBtn = screen.getByRole('button', { name: '' }); // Lucide icons often don't have text
    // Let's find by the button that contains the eye icon
    const buttons = screen.getAllByRole('button');
    const eyeBtn = buttons.find(b => b.querySelector('svg'));
    
    if (eyeBtn) {
      fireEvent.click(eyeBtn);
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
      expect(screen.getByText(/1.000000 ETH/i)).toBeInTheDocument();
    }
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <SecureTransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls signAndVerifyTransaction when Sign & Verify button is clicked', async () => {
    const mockSigner = {};
    mockUseSecureTransaction.signAndVerifyTransaction.mockResolvedValue({
      verified: true,
      signer: '0xUserAddress',
      domain: { name: 'PropChain', version: '1', chainId: 1 },
      timestamp: Date.now(),
    });

    render(
      <SecureTransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        signer={mockSigner as any}
      />
    );

    const signBtn = screen.getByRole('button', { name: /sign & verify/i });
    fireEvent.click(signBtn);

    expect(mockUseSecureTransaction.signAndVerifyTransaction).toHaveBeenCalled();
  });
});
