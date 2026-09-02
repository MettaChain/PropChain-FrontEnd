'use client';
import { logger } from '@/utils/logger';

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WalletValidator, AddressValidationResult } from '@/utils/security/walletValidator';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  X,
  Info,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

/** Validation states surfaced to consumers via `onValidationChange`. */
export enum AddressValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  EMPTY = 'empty',
  CHECKSUM = 'checksum',
}

interface WalletAddressInputProps {
  value: string;
  onChange: (address: string, validationResult?: AddressValidationResult) => void;
  placeholder?: string;
  disabled?: boolean;
  allowENS?: boolean;
  requireChecksum?: boolean;
  checkBlacklist?: boolean;
  showValidationDetails?: boolean;
  className?: string;
  type?: string;
  id?: string;
  name?: string;
  /** External inline error message (e.g. form-level validation). */
  error?: string;
  /** Optional override validator that must also accept the address. */
  customValidator?: (address: string) => boolean;
  /** Called whenever the derived validation status changes. */
  onValidationChange?: (status: AddressValidationStatus, address: string) => void;
  showValidation?: boolean;
  required?: boolean;
  maxLength?: number;
  autoFormat?: boolean;
  'aria-label'?: string;
  [key: string]: unknown;
}

export const WalletAddressInput: React.FC<WalletAddressInputProps> = ({
  value,
  onChange,
  placeholder = '0x...',
  disabled = false,
  allowENS = true,
  requireChecksum = true,
  checkBlacklist = true,
  showValidationDetails = true,
  className = '',
  type = 'text',
  id = 'wallet-address-input',
  name = 'walletAddress',
  error,
  customValidator,
  onValidationChange,
  showValidation,
  required = false,
  maxLength,
  autoFormat = true,
  ...inputProps
}) => {
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync the internal input value when the external controlled value changes
  // (e.g. form reset) so the rendered input always reflects the supplied value.
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const displayValidation = showValidation ?? showValidationDetails;

  const deriveStatus = (address: string, result: AddressValidationResult | null): AddressValidationStatus => {
    const trimmed = address.trim();
    if (!trimmed) return AddressValidationStatus.EMPTY;
    if (customValidator && !customValidator(trimmed)) return AddressValidationStatus.INVALID;
    if (result && !result.isChecksumValid) return AddressValidationStatus.CHECKSUM;
    if (!result) return AddressValidationStatus.EMPTY;
    return result.isValid ? AddressValidationStatus.VALID : AddressValidationStatus.INVALID;
  };

  const validateAddress = useCallback(
    async (address: string) => {
      const trimmed = address.trim();
      if (!trimmed) {
        setValidationResult(null);
        if (onValidationChange) {
          onValidationChange(AddressValidationStatus.EMPTY, '');
        }
        return;
      }
      setIsValidating(true);
      try {
        const result = await WalletValidator.validateWalletAddressInput(trimmed, {
          allowENS,
          requireChecksum,
          checkBlacklist,
        });
        setValidationResult(result);
        const status = deriveStatus(trimmed, result);
        if (onValidationChange) {
          onValidationChange(status, trimmed);
        }
        if (status === AddressValidationStatus.INVALID || status === AddressValidationStatus.CHECKSUM) {
          onChange(trimmed, result);
        } else {
          onChange(result.address, result);
        }
      } catch (err) {
        logger.error('Address validation failed:', err);
        setValidationResult(null);
        if (onValidationChange) {
          onValidationChange(AddressValidationStatus.INVALID, trimmed);
        }
      } finally {
        setIsValidating(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowENS, requireChecksum, checkBlacklist, customValidator, onValidationChange, onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const trimmed = raw.trim();
    let next =
      autoFormat && trimmed && !trimmed.startsWith('0x') && /^[0-9a-fA-F]{40}$/.test(trimmed)
        ? `0x${trimmed}`
        : trimmed;
    if (maxLength && next.length > maxLength) {
      next = next.slice(0, maxLength);
    }
    setInputValue(next);
    setValidationResult(null);
    onChange(next);
    if (!next) {
      if (onValidationChange) {
        onValidationChange(AddressValidationStatus.EMPTY, '');
      }
      return;
    }
    validateAddress(next);
  };

  const displayedError = error && error.trim() ? error : null;

  const customValidationFailed =
    Boolean(customValidator) && Boolean(inputValue.trim()) && !customValidator!(inputValue.trim());

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore >= 75) return 'text-red-600 dark:text-red-400';
    if (riskScore >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (riskScore >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskLevelBg = (riskScore: number) => {
    if (riskScore >= 75) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (riskScore >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (riskScore >= 25) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  const getRiskLevelText = (riskScore: number) => {
    if (riskScore >= 75) return 'Critical Risk';
    if (riskScore >= 50) return 'High Risk';
    if (riskScore >= 25) return 'Medium Risk';
    return 'Low Risk';
  };

  const renderValidationStatus = () => {
    if (!displayValidation) return null;
    if (!validationResult || !inputValue.trim()) return null;

    const { isValid, errors, warnings, riskScore, isBlacklisted, isVerified, ensName } = validationResult;

    if (isBlacklisted) {
      return (
        <Alert className="mt-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Blocked:</strong> This address is flagged as a known scam or compromised address.
            Transactions to this address are not allowed.
          </AlertDescription>
        </Alert>
      );
    }

    if (!isValid) {
      return (
        <Alert className="mt-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="space-y-1">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        <div className={`rounded-lg border p-3 ${getRiskLevelBg(riskScore)}`}>
          <div className="flex items-center gap-2">
            {riskScore >= 50 ? (
              <AlertTriangle className={`h-4 w-4 ${getRiskLevelColor(riskScore)}`} />
            ) : (
              <Shield className={`h-4 w-4 ${getRiskLevelColor(riskScore)}`} />
            )}
            <span className={`text-sm font-medium ${getRiskLevelColor(riskScore)}`}>
              {getRiskLevelText(riskScore)} (Risk Score: {riskScore}/100)
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {ensName ? `ENS: ${ensName}` : formatAddress(validationResult.address)}
              </span>
            </div>
            {ensName && (
              <Badge variant="secondary" className="text-xs">
                Resolved
              </Badge>
            )}
          </div>
          {ensName && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Address: {formatAddress(validationResult.address)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {isVerified ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 dark:text-green-400">Verified address</span>
            </>
          ) : (
            <>
              <Info className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-600 dark:text-yellow-400">Unverified address - exercise caution</span>
            </>
          )}
        </div>

        {warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <div className="space-y-1">
                {warnings.map((warning) => (
                  <div key={warning} className="text-sm">
                    • {warning}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const hasError = Boolean(displayedError) || Boolean(validationResult && !validationResult.isValid && inputValue.trim()) || customValidationFailed;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={type}
          id={id}
          name={name}
          required={required}
          maxLength={maxLength}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isValidating}
          aria-invalid={hasError}
          aria-describedby={hasError && displayedError ? `${id}-error` : undefined}
          className={`pr-10 ${disabled || isValidating ? 'bg-gray-100' : ''} ${hasError ? 'border-red-300' : ''} ${className}`}
          {...inputProps}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        )}
        {!isValidating && validationResult && inputValue.trim() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validationResult.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" role="img" aria-label="Valid address" />
            ) : (
              <X className="h-4 w-4 text-red-600" role="img" aria-label="Invalid address" />
            )}
          </div>
        )}
      </div>

      {displayedError && (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {displayedError}
        </p>
      )}

      {customValidationFailed && !displayedError && (
        <p className="text-sm text-red-600 dark:text-red-400">Address failed custom validation</p>
      )}

      {required && !inputValue.trim() && !displayedError && (
        <p className="text-sm text-red-600 dark:text-red-400">Wallet address is required</p>
      )}

      {displayValidation && renderValidationStatus()}

      {showHelp && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Address Validation Help</h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              • <strong>Ethereum Address:</strong> Must start with &quot;0x&quot; followed by 40 hex characters
            </div>
            <div>
              • <strong>ENS Names:</strong> Human-readable names ending in &quot;.eth&quot; (e.g., vitalik.eth)
            </div>
            <div>
              • <strong>Checksum:</strong> Addresses must use proper capitalization (EIP-55)
            </div>
            <div>
              • <strong>Verification:</strong> We check addresses against known scams and verify activity
            </div>
            <div>
              • <strong>Risk Score:</strong> Lower scores indicate safer addresses (0-100 scale)
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        {showHelp ? 'Hide' : 'Show'} validation help
      </button>
    </div>
  );
};