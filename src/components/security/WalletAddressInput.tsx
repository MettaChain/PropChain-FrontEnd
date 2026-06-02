'use client';
import { logger } from '@/utils/logger';

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  RefreshCw
} from 'lucide-react';

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
}

export const WalletAddressInput: React.FC<WalletAddressInputProps> = ({
  value,
  onChange,
  placeholder = '0x... or ENS name (e.g., vitalik.eth)',
  disabled = false,
  allowENS = true,
  requireChecksum = true,
  checkBlacklist = true,
  showValidationDetails = true,
  className = '',
}) => {
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce input to avoid excessive validation calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Validate address when debounced value changes
  useEffect(() => {
    if (debouncedValue.trim()) {
      validateAddress(debouncedValue);
    } else {
      setValidationResult(null);
    }
  }, [debouncedValue, allowENS, requireChecksum, checkBlacklist]);

  const validateAddress = useCallback(async (address: string) => {
    setIsValidating(true);
    try {
      const result = await WalletValidator.validateWalletAddressInput(address, {
        allowENS,
        requireChecksum,
        checkBlacklist,
      });
      setValidationResult(result);
      
      // Call onChange with the validated address and result
      if (result.isValid) {
        onChange(result.address, result);
      } else {
        onChange(address, result);
      }
    } catch (error) {
      logger.error('Address validation failed:', error);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  }, [allowENS, requireChecksum, checkBlacklist, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

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
    if (!validationResult || !debouncedValue.trim()) return null;

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
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {/* Risk Assessment */}
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

        {/* Address Info */}
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

        {/* Verification Status */}
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

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <div className="space-y-1">
                <strong>Warnings:</strong>
                {warnings.map((warning, index) => (
                  <div key={index} className="text-sm">• {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isValidating}
          className={`pr-10 ${validationResult && !validationResult.isValid ? 'border-red-300' : ''}`}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {showValidationDetails && renderValidationStatus()}

      {/* Help Section */}
      {showHelp && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Address Validation Help</h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>• <strong>Ethereum Address:</strong> Must start with "0x" followed by 40 hex characters</div>
            <div>• <strong>ENS Names:</strong> Human-readable names ending in ".eth" (e.g., vitalik.eth)</div>
            <div>• <strong>Checksum:</strong> Addresses must use proper capitalization (EIP-55)</div>
            <div>• <strong>Verification:</strong> We check addresses against known scams and verify activity</div>
            <div>• <strong>Risk Score:</strong> Lower scores indicate safer addresses (0-100 scale)</div>
          </div>
        </div>
      )}

      {/* Help Toggle */}
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
