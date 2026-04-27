'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSecurity } from '@/hooks/useSecurity';
import { AlertTriangle, Shield, CheckCircle, X, Eye, EyeOff, Info } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useKycStore } from '@/store/kycStore';
import { formatEthAmount, shouldRequireKyc, weiToEth } from '@/lib/kyc';

interface TransactionConfirmationProps {
  isOpen: boolean;
  transaction: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  isOpen,
  transaction,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const { validateTransaction } = useSecurity();
  const walletAddress = useWalletStore((state) => state.address);
  const { profile, logTransactionScreening } = useKycStore();
  const [validation, setValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [transactionEth, setTransactionEth] = useState(0);
  const [kycRequired, setKycRequired] = useState(false);

  React.useEffect(() => {
    if (isOpen && transaction) {
      validateTransactionData();
      const valueEth = weiToEth(transaction.value);
      const requiresKyc = shouldRequireKyc(transaction.value, profile.thresholdEth);
      setTransactionEth(valueEth);
      setKycRequired(requiresKyc);
      logTransactionScreening(valueEth, requiresKyc, profile.status === 'verified' || !requiresKyc);
    }
  }, [isOpen, transaction, profile.status, profile.thresholdEth, logTransactionScreening]);

  const validateTransactionData = async () => {
    setValidating(true);
    try {
      const result = await validateTransaction(
        transaction.to,
        transaction.value,
        transaction.data || '0x'
      );
      setValidation(result);
    } catch (error) {
      console.error('Transaction validation failed:', error);
      setValidation({
        isValid: false,
        riskScore: 100,
        warnings: ['Validation failed'],
        blocks: ['Unable to validate transaction'],
        requiresConfirmation: true
      });
    } finally {
      setValidating(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatEther = (wei: string) => {
    const eth = Number(BigInt(wei)) / 1e18;
    return eth.toFixed(6);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Confirm Transaction
          </h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {validating ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Validating transaction security...
              </span>
            </div>
          ) : validation ? (
            <>
              {/* Risk Assessment */}
              <div className={`mb-6 p-4 border rounded-lg ${getRiskLevelBg(validation.riskScore)}`}>
                <div className="flex items-center gap-3">
                  {validation.riskScore >= 50 ? (
                    <AlertTriangle className={`w-5 h-5 ${getRiskLevelColor(validation.riskScore)}`} />
                  ) : (
                    <Shield className={`w-5 h-5 ${getRiskLevelColor(validation.riskScore)}`} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${getRiskLevelColor(validation.riskScore)}`}>
                        Security Assessment
                      </h3>
                      <span className={`text-sm px-2 py-1 rounded-full ${getRiskLevelBg(validation.riskScore)} ${getRiskLevelColor(validation.riskScore)}`}>
                        {getRiskLevelText(validation.riskScore)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Risk Score: {validation.riskScore}/100
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Warnings */}
              {validation.warnings.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Security Warnings
                      </h4>
                      <div className="space-y-1">
                        {validation.warnings.map((warning: string, index: number) => (
                          <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Blocks */}
              {validation.blocks.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Transaction Blocked
                      </h4>
                      <div className="space-y-1">
                        {validation.blocks.map((block: string, index: number) => (
                          <p key={index} className="text-sm text-red-700 dark:text-red-300">
                            • {block}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Details */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Transaction Details
                  </h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </button>
                </div>

                <div className={`space-y-3 ${showDetails ? 'block' : 'hidden'}`}>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {formatAddress(transaction.to)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatEther(transaction.value)} ETH
                    </span>
                  </div>

                  {transaction.gasLimit && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gas Limit:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.gasLimit}
                      </span>
                    </div>
                  )}

                  {transaction.gasPrice && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gas Price:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatEther(transaction.gasPrice)} ETH
                      </span>
                    </div>
                  )}

                  {transaction.data && transaction.data !== '0x' && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data:</span>
                        <button
                          onClick={() => setShowRawData(!showRawData)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {showRawData ? (
                        <div className="text-xs font-mono text-gray-900 dark:text-white break-all">
                          {transaction.data}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Contract interaction data ({transaction.data.length} bytes)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                {validation.isValid && (!kycRequired || profile.status === 'verified') ? (
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Confirm Transaction
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 px-4 py-3 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {kycRequired && profile.status !== 'verified' ? 'Complete KYC' : 'Transaction Blocked'}
                  </button>
                )}
              </div>

              {/* Security Info */}
              {validation.requiresConfirmation && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      This transaction requires additional confirmation due to security considerations. 
                      Please review all details carefully before proceeding.
                    </p>
                  </div>
                </div>
              )}

              {kycRequired && profile.status !== 'verified' && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">
                        KYC required before approval
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Transactions at or above {formatEthAmount(profile.thresholdEth)} ETH require a verified identity.
                      </p>
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-2">
                        This transfer is approximately {formatEthAmount(transactionEth)} ETH for wallet{' '}
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'unknown'}.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href="/compliance"
                          className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
                        >
                          Open compliance center
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
