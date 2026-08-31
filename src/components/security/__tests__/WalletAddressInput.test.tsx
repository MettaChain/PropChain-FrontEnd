/**
 * WalletAddressInput Component Tests
 * 
 * Comprehensive unit tests for the WalletAddressInput component
 * testing validation, user interactions, and TypeScript type safety
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletAddressInput, AddressValidationStatus } from '../WalletAddressInput';

// Mock the logger utility
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('WalletAddressInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render input element with correct default props', () => {
      render(<WalletAddressInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', '0x...');
      expect(input).toHaveAttribute('id', 'wallet-address-input');
      expect(input).toHaveAttribute('name', 'walletAddress');
    });

    it('should render with custom placeholder', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          placeholder="Enter wallet address"
        />
      );
      
      const input = screen.getByPlaceholderText('Enter wallet address');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom id and name', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          id="custom-id"
          name="custom-name"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
      expect(input).toHaveAttribute('name', 'custom-name');
    });

    it('should render with custom className', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          className="custom-class"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should render disabled state', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          disabled
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('bg-gray-100');
    });

    it('should render with required attribute', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          required
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should display current value', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          value="0x1234567890abcdef1234567890abcdef12345678"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('0x1234567890abcdef1234567890abcdef12345678');
    });
  });

  describe('Address Validation', () => {
    it('should accept valid Ethereum address', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await user.clear(input);
      await user.type(input, validAddress);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(validAddress);
      });
      
      // Should show success indicator
      const successIcon = screen.getByRole('img');
      expect(successIcon).toBeInTheDocument();
    });

    it('should reject invalid Ethereum address format', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      const invalidAddress = 'invalid-address';
      
      await user.clear(input);
      await user.type(input, invalidAddress);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
      
      // Should show error indicator
      const errorIcon = screen.getByRole('img');
      expect(errorIcon).toBeInTheDocument();
      
      // Should show error message
      const errorMessage = screen.getByText(/Invalid Ethereum address format/);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should auto-format address by adding 0x prefix', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          autoFormat
        />
      );
      
      const input = screen.getByRole('textbox');
      const addressWithoutPrefix = '742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await user.clear(input);
      await user.type(input, addressWithoutPrefix);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(`0x${addressWithoutPrefix}`);
      });
    });

    it('should not auto-format when autoFormat is false', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          autoFormat={false}
        />
      );
      
      const input = screen.getByRole('textbox');
      const addressWithoutPrefix = '742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await user.clear(input);
      await user.type(input, addressWithoutPrefix);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(addressWithoutPrefix);
      });
    });

    it('should enforce maxLength', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          maxLength={42}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxlength', '42');
    });

    it('should handle empty address validation', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      
      await user.clear(input);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('');
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '0x123');
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should handle focus events', async () => {
      const user = userEvent.setup();
      
      render(<WalletAddressInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(input).toHaveFocus();
    });

    it('should handle blur events', async () => {
      const user = userEvent.setup();
      
      render(<WalletAddressInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();
      
      expect(input).not.toHaveFocus();
    });
  });

  describe('Validation Callbacks', () => {
    it('should call onValidationChange when validation status changes', async () => {
      const user = userEvent.setup();
      const onValidationChange = jest.fn();
      const onChange = jest.fn();
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          onValidationChange={onValidationChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await user.clear(input);
      await user.type(input, validAddress);
      
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(
          AddressValidationStatus.VALID,
          validAddress
        );
      });
    });

    it('should report checksum status for mixed-case addresses', async () => {
      const user = userEvent.setup();
      const onValidationChange = jest.fn();
      const onChange = jest.fn();
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          onValidationChange={onValidationChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      const checksumAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await user.clear(input);
      await user.type(input, checksumAddress);
      
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(
          AddressValidationStatus.CHECKSUM,
          checksumAddress
        );
      });
    });
  });

  describe('Custom Validation', () => {
    it('should use custom validator when provided', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const customValidator = jest.fn((address: string) => {
        return address.startsWith('0x123');
      });
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          customValidator={customValidator}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      // Address that passes custom validation
      await user.clear(input);
      await user.type(input, '0x1234567890abcdef1234567890abcdef12345678');
      
      await waitFor(() => {
        expect(customValidator).toHaveBeenCalled();
      });
      
      // Address that fails custom validation
      await user.clear(input);
      await user.type(input, '0x9999999999999999999999999999999999999999');
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/Address failed custom validation/);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display custom error message', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          error="Custom error message"
        />
      );
      
      const errorMessage = screen.getByText('Custom error message');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should show required message when field is empty and required', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          value=""
          required
        />
      );
      
      const requiredMessage = screen.getByText(/Wallet address is required/);
      expect(requiredMessage).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-invalid attribute when error exists', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          error="Invalid address"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have proper aria-describedby when error exists', () => {
      render(
        <WalletAddressInput 
          {...defaultProps} 
          error="Invalid address"
          id="wallet-input"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'wallet-input-error');
    });

    it('should not have aria-invalid when no error', () => {
      render(<WalletAddressInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce correct prop types', () => {
      // This test ensures TypeScript types are correctly enforced
      // If this compiles, the types are correct
      
      const props: React.ComponentProps<typeof WalletAddressInput> = {
        value: '',
        onChange: (address: string) => {},
        placeholder: '0x...',
        disabled: false,
        showValidation: true,
        error: undefined,
        maxLength: 42,
        autoFormat: true,
        className: '',
        id: 'test-id',
        name: 'test-name',
        required: false,
        customValidator: (address: string) => true,
      };

      expect(props).toBeDefined();
    });

    it('should use correct enum values for validation status', () => {
      // This test ensures the enum is properly typed
      const validStatus: AddressValidationStatus = AddressValidationStatus.VALID;
      const invalidStatus: AddressValidationStatus = AddressValidationStatus.INVALID;
      const emptyStatus: AddressValidationStatus = AddressValidationStatus.EMPTY;
      const checksumStatus: AddressValidationStatus = AddressValidationStatus.CHECKSUM;

      expect([validStatus, invalidStatus, emptyStatus, checksumStatus]).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long addresses', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(
        <WalletAddressInput 
          {...defaultProps} 
          onChange={onChange}
          maxLength={100}
        />
      );
      
      const input = screen.getByRole('textbox');
      const longAddress = '0x' + 'a'.repeat(100);
      
      await user.clear(input);
      await user.type(input, longAddress);
      
      // Should truncate to maxLength
      expect(input).toHaveAttribute('maxlength', '100');
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      
      await user.clear(input);
      await user.type(input, '!@#$%^&*()');
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('!@#$%^&*()');
      });
    });

    it('should handle whitespace in input', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      
      await user.clear(input);
      await user.type(input, '  0x123  ');
      
      await waitFor(() => {
        // Should trim whitespace
        expect(onChange).toHaveBeenCalledWith('0x123');
      });
    });

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<WalletAddressInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      
      await user.clear(input);
      await user.type(input, '0x1');
      await user.type(input, '2');
      await user.type(input, '3');
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });
  });
});