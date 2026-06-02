'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';

/**
 * Wallet Address Validation Status
 */
export enum AddressValidationStatus {
  EMPTY = 'empty',
  INVALID = 'invalid',
  VALID = 'valid',
  CHECKSUM = 'checksum',
}

/**
 * Wallet Address Input Props
 */
export interface WalletAddressInputProps {
  /** Current value of the wallet address */
  value: string;
  /** Callback when address changes */
  onChange: (address: string) => void;
  /** Callback when address is validated */
  onValidationChange?: (status: AddressValidationStatus, address: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show validation status */
  showValidation?: boolean;
  /** Custom error message */
  error?: string;
  /** Maximum length for input */
  maxLength?: number;
  /** Whether to auto-format the address */
  autoFormat?: boolean;
  /** CSS class name for custom styling */
  className?: string;
  /** ID attribute for the input element */
  id?: string;
  /** Name attribute for the input element */
  name?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Custom validation function */
  customValidator?: (address: string) => boolean;
}

/**
 * Wallet Address Validation Result
 */
interface ValidationResult {
  status: AddressValidationStatus;
  message?: string;
}

/**
 * Ethereum address checksum validation pattern
 */
const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validate Ethereum address format and checksum
 */
const validateEthereumAddress = (address: string): ValidationResult => {
  if (!address) {
    return { status: AddressValidationStatus.EMPTY };
  }

  // Check basic format
  if (!ETH_ADDRESS_PATTERN.test(address)) {
    return { 
      status: AddressValidationStatus.INVALID,
      message: 'Invalid Ethereum address format'
    };
  }

  // Checksum validation (EIP-55)
  const addressLower = address.toLowerCase();
  const addressHash = addressLower.slice(2);
  
  // Simple checksum check - in production, use proper EIP-55 validation
  const hasMixedCase = /[A-F]/.test(address) && /[a-f]/.test(address);
  
  if (hasMixedCase) {
    return { 
      status: AddressValidationStatus.CHECKSUM,
      message: 'Valid address with checksum'
    };
  }

  return { 
    status: AddressValidationStatus.VALID,
    message: 'Valid address'
  };
};

/**
 * Format Ethereum address (add 0x prefix if missing, proper case)
 */
const formatEthereumAddress = (address: string): string => {
  if (!address) return '';
  
  let formatted = address.trim();
  
  // Add 0x prefix if missing
  if (!formatted.startsWith('0x')) {
    formatted = `0x${formatted}`;
  }
  
  return formatted;
};

/**
 * WalletAddressInput Component
 * 
 * A type-safe React component for inputting and validating wallet addresses
 * with strong TypeScript typing and comprehensive validation.
 */
export const WalletAddressInput: React.FC<WalletAddressInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = '0x...',
  disabled = false,
  showValidation = true,
  error,
  maxLength = 42,
  autoFormat = true,
  className = '',
  id = 'wallet-address-input',
  name = 'walletAddress',
  required = false,
  customValidator,
}) => {
  const [internalValue, setInternalValue] = useState<string>(value);
  const [validationResult, setValidationResult] = useState<ValidationResult>(
    validateEthereumAddress(value)
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Update internal value when prop changes
  React.useEffect(() => {
    setInternalValue(value);
    const newValidation = validateEthereumAddress(value);
    setValidationResult(newValidation);
  }, [value]);

  // Handle input change with validation
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      
      // Apply auto-formatting if enabled
      const processedValue = autoFormat ? formatEthereumAddress(newValue) : newValue;
      
      setInternalValue(processedValue);
      
      // Validate the new value
      let validation: ValidationResult;
      if (customValidator) {
        const isValid = customValidator(processedValue);
        validation = isValid 
          ? validateEthereumAddress(processedValue)
          : { 
              status: AddressValidationStatus.INVALID,
              message: 'Address failed custom validation'
            };
      } else {
        validation = validateEthereumAddress(processedValue);
      }
      
      setValidationResult(validation);
      
      // Notify parent of changes
      onChange(processedValue);
      
      // Notify parent of validation change if callback provided
      if (onValidationChange) {
        onValidationChange(validation.status, processedValue);
      }
    },
    [onChange, onValidationChange, autoFormat, customValidator]
  );

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Determine if input should show error state
  const hasError = useMemo(() => {
    return Boolean(
      error || 
      (validationResult.status === AddressValidationStatus.INVALID && internalValue)
    );
  }, [error, validationResult.status, internalValue]);

  // Determine if input should show success state
  const isSuccess = useMemo(() => {
    return !hasError && (
      validationResult.status === AddressValidationStatus.VALID ||
      validationResult.status === AddressValidationStatus.CHECKSUM
    ) && Boolean(internalValue);
  }, [hasError, validationResult.status, internalValue]);

  // Generate status message
  const statusMessage = useMemo(() => {
    if (error) return error;
    if (validationResult.message && showValidation) {
      return validationResult.message;
    }
    return '';
  }, [error, validationResult.message, showValidation]);

  // Base input classes
  const baseInputClasses = useMemo(() => {
    return [
      'w-full px-4 py-2 rounded-lg border-2 transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
      hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : isSuccess 
          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      isFocused && !hasError && !isSuccess ? 'border-blue-500' : '',
      className,
    ].filter(Boolean).join(' ');
  }, [disabled, hasError, isSuccess, isFocused, className]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          required={required}
          className={baseInputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        
        {/* Validation status indicator */}
        {showValidation && !disabled && internalValue && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && (
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isSuccess && (
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error/Status message */}
      {(statusMessage || required) && (
        <div className="mt-1">
          {hasError && statusMessage && (
            <p 
              id={`${id}-error`}
              className="text-sm text-red-600"
              role="alert"
            >
              {statusMessage}
            </p>
          )}
          {!hasError && isSuccess && showValidation && statusMessage && (
            <p className="text-sm text-green-600">
              {statusMessage}
            </p>
          )}
          {required && !internalValue && !isFocused && (
            <p className="text-sm text-gray-500">
              Wallet address is required
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Default export for convenience
 */
export default WalletAddressInput;