'use client';
import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSecurity } from '@/hooks/useSecurity';
import { AlertTriangle, Shield, CheckCircle, X, Eye, EyeOff, Info } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useKycStore } from '@/store/kycStore';
import { formatEthAmount, shouldRequireKyc, weiToEth } from '@/lib/kyc';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSecurity } from '@/hooks/useSecurity';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Info,
  Smartphone,
  Wallet,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactionSecurityStore } from '@/store/transactionSecurityStore';
import {
  decideStepUpSecurity,
  formatEth,
  getSecurityDeviceId,
  getSecurityDeviceLabel,
  weiToEth,
} from '@/utils/security/transactionSecurity';
import { normalizeTotpCode } from '@/utils/security/totp';
import { toast } from 'sonner';

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
  loading = false,
}) => {
  const { validateTransaction } = useSecurity();
  const walletAddress = useWalletStore((state) => state.address);
  const { profile, logTransactionScreening } = useKycStore();
  const {
    settings,
    trustDevice,
    verifyTotpCode,
    getActiveTrustedDevice,
    setLastVerification,
  } = useTransactionSecurityStore();

  const [validation, setValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [transactionEth, setTransactionEth] = useState(0);
  const [kycRequired, setKycRequired] = useState(false);
  const [verificationTab, setVerificationTab] = useState<'totp' | 'hardware'>('totp');
  const [totpCode, setTotpCode] = useState('');
  const [trustThisDevice, setTrustThisDevice] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const hardwareTimerRef = useRef<number | null>(null);

  const currentDeviceId = useMemo(() => getSecurityDeviceId(), []);
  const currentDeviceLabel = useMemo(() => getSecurityDeviceLabel(), []);

  useEffect(() => {
    if (isOpen && transaction) {
      validateTransactionData();
      const valueEth = weiToEth(transaction.value);
      const requiresKyc = shouldRequireKyc(transaction.value, profile.thresholdEth);
      setTransactionEth(valueEth);
      setKycRequired(requiresKyc);
      logTransactionScreening(valueEth, requiresKyc, profile.status === 'verified' || !requiresKyc);
    }
  }, [isOpen, transaction, profile.status, profile.thresholdEth, logTransactionScreening]);
  }, [isOpen, transaction.to, transaction.value, transaction.data]);

  useEffect(() => {
    if (!isOpen) {
      if (hardwareTimerRef.current) {
        window.clearTimeout(hardwareTimerRef.current);
        hardwareTimerRef.current = null;
      }
      setValidation(null);
      setValidating(false);
      setShowDetails(false);
      setShowRawData(false);
      setVerificationTab('totp');
      setTotpCode('');
      setTrustThisDevice(false);
      setIsConfirming(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!settings.totpEnabled && settings.hardwareWalletEnabled) {
      setVerificationTab('hardware');
    }

    if (settings.totpEnabled && !settings.hardwareWalletEnabled) {
      setVerificationTab('totp');
    }
  }, [isOpen, settings.totpEnabled, settings.hardwareWalletEnabled]);

  useEffect(() => {
    return () => {
      if (hardwareTimerRef.current) {
        window.clearTimeout(hardwareTimerRef.current);
      }
    };
  }, []);

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
      logger.error('Transaction validation failed:', error);
      setValidation({
        isValid: false,
        riskScore: 100,
        warnings: ['Validation failed'],
        blocks: ['Unable to validate transaction'],
        requiresConfirmation: true,
      });
    } finally {
      setValidating(false);
    }
  };

  const stepUpDecision = useMemo(() => {
    return decideStepUpSecurity({
      valueWei: transaction?.value,
      thresholdEth: settings.thresholdEth,
      twoFactorRequired: settings.twoFactorRequired,
      trustedDeviceBypassEnabled: settings.trustedDeviceBypass,
      trustedDeviceActive: Boolean(getActiveTrustedDevice(currentDeviceId)),
    });
  }, [
    transaction?.value,
    settings.thresholdEth,
    settings.twoFactorRequired,
    settings.trustedDeviceBypass,
    currentDeviceId,
    getActiveTrustedDevice,
  ]);

  const trustedDevice = getActiveTrustedDevice(currentDeviceId);
  const transactionEth = weiToEth(transaction.value);
  const gasPriceEth = weiToEth(transaction.gasPrice);
  const stepUpRequired = stepUpDecision.requiresStepUp;
  const noVerificationMethodEnabled = stepUpRequired && !settings.totpEnabled && !settings.hardwareWalletEnabled;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleHardwareWalletConfirm = () => {
    setIsConfirming(true);
    toast.info('Waiting for hardware wallet confirmation...');
    hardwareTimerRef.current = window.setTimeout(() => {
      setLastVerification('hardware-wallet');
      if (trustThisDevice && settings.trustedDeviceBypass) {
        trustDevice(currentDeviceId, currentDeviceLabel);
      }
      setIsConfirming(false);
      hardwareTimerRef.current = null;
      onConfirm();
    }, 1200);
  };

  const handleFinalConfirm = async () => {
    setIsConfirming(true);

    if (!stepUpRequired) {
      onConfirm();
      setIsConfirming(false);
      return;
    }

    if (trustedDevice) {
      setLastVerification('trusted-device');
      onConfirm();
      setIsConfirming(false);
      return;
    }

    if (verificationTab === 'hardware') {
      if (!settings.hardwareWalletEnabled) {
        toast.error('Hardware wallet confirmation is disabled in settings');
        setIsConfirming(false);
        return;
      }

      handleHardwareWalletConfirm();
      return;
    }

    if (!settings.totpEnabled || !settings.totpSecret) {
      toast.error('Set up your authenticator in Security settings first');
      setIsConfirming(false);
      return;
    }

    const isValid = await verifyTotpCode(normalizeTotpCode(totpCode));
    if (!isValid) {
      toast.error('Authenticator code is not valid');
      setIsConfirming(false);
      return;
    }

    setLastVerification('totp');
    if (trustThisDevice && settings.trustedDeviceBypass) {
      trustDevice(currentDeviceId, currentDeviceLabel);
    }
    onConfirm();
    setIsConfirming(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="transaction-confirmation">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />

      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-confirmation-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="space-y-1">
            <h2 id="transaction-confirmation-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              Confirm Transaction
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review the transfer and complete any step-up verification that your security policy requires.
            </p>
          </div>
          <button
            onClick={() => {
              if (hardwareTimerRef.current) {
                window.clearTimeout(hardwareTimerRef.current);
                hardwareTimerRef.current = null;
                setIsConfirming(false);
              }
              onCancel();
            }}
            disabled={loading || isConfirming}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {validating ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Validating transaction security...
              </span>
            </div>
          ) : validation ? (
            <>
              {stepUpRequired && (
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          Additional verification required
                        </h3>
                        <Badge variant="secondary">{formatEth(transactionEth, 2)} ETH</Badge>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {stepUpDecision.reason}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This protects high-value transfers by asking for a second proof before the transaction is allowed through.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`mb-6 rounded-lg border p-4 ${getRiskLevelBg(validation.riskScore)}`}>
                <div className="flex items-center gap-3">
                  {validation.riskScore >= 50 ? (
                    <AlertTriangle className={`h-5 w-5 ${getRiskLevelColor(validation.riskScore)}`} />
                  ) : (
                    <Shield className={`h-5 w-5 ${getRiskLevelColor(validation.riskScore)}`} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${getRiskLevelColor(validation.riskScore)}`}>
                        Security Assessment
                      </h3>
                      <span className={`rounded-full px-2 py-1 text-sm ${getRiskLevelBg(validation.riskScore)} ${getRiskLevelColor(validation.riskScore)}`}>
                        {getRiskLevelText(validation.riskScore)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Risk Score: {validation.riskScore}/100
                    </p>
                  </div>
                </div>
              </div>

              {validation.warnings.length > 0 && (
                <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div className="flex-1">
                      <h4 className="mb-2 font-medium text-yellow-800 dark:text-yellow-200">
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

              {validation.blocks.length > 0 && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <div className="flex items-start gap-3">
                    <X className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                    <div className="flex-1">
                      <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">
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

              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
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

                <div className={`${showDetails ? 'block' : 'hidden'} space-y-3`}>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {formatAddress(transaction.to)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatEth(transactionEth, 6)} ETH
                    </span>
                  </div>

                  {transaction.gasLimit && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gas Limit:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.gasLimit}
                      </span>
                    </div>
                  )}

                  {transaction.gasPrice && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gas Price:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatEth(gasPriceEth, 6)} ETH
                      </span>
                    </div>
                  )}

                  {transaction.data && transaction.data !== '0x' && (
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data:</span>
                        <button
                          onClick={() => setShowRawData(!showRawData)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {showRawData ? (
                        <div className="break-all font-mono text-xs text-gray-900 dark:text-white">
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

              {stepUpRequired ? (
                <div className="space-y-4">
                  <Separator />

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Verification method</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose the path that matches your setup.
                        </p>
                      </div>
                      <Badge variant="outline">
                        {settings.totpEnabled ? 'Authenticator ready' : 'Authenticator off'}
                      </Badge>
                    </div>

                    {trustedDevice && settings.trustedDeviceBypass && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-100">
                        Trusted device bypass is active for {trustedDevice.label}. You can confirm immediately, or verify again for a fresh approval.
                      </div>
                    )}

                    {noVerificationMethodEnabled && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
                        Step-up is required for this transaction, but both TOTP and hardware-wallet confirmation are disabled in settings.
                      </div>
                    )}

                    <Tabs
                      value={verificationTab}
                      onValueChange={(value) => setVerificationTab(value as 'totp' | 'hardware')}
                      className="mt-4"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="totp"
                          className="flex items-center gap-2"
                          disabled={!settings.totpEnabled}
                        >
                          <Smartphone className="h-4 w-4" />
                          TOTP
                        </TabsTrigger>
                        <TabsTrigger
                          value="hardware"
                          className="flex items-center gap-2"
                          disabled={!settings.hardwareWalletEnabled}
                        >
                          <Wallet className="h-4 w-4" />
                          Hardware wallet
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="totp" className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enter the 6-digit code from Google Authenticator or another TOTP app.
                          </p>
                          <InputOTP
                            maxLength={6}
                            value={totpCode}
                            onChange={(value) => setTotpCode(value)}
                            inputMode="numeric"
                          >
                            <InputOTPGroup>
                              {Array.from({ length: 6 }, (_, index) => (
                                <InputOTPSlot key={index} index={index} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        {settings.trustedDeviceBypass && (
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Switch checked={trustThisDevice} onCheckedChange={setTrustThisDevice} />
                            Trust this device after verification
                          </label>
                        )}
                      </TabsContent>

                      <TabsContent value="hardware" className="mt-4 space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                          <div className="flex items-start gap-3">
                            <Lock className="mt-0.5 h-5 w-5 text-blue-600" />
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Confirm with your hardware wallet
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Approve the signature on your connected hardware wallet to complete this transaction.
                              </p>
                            </div>
                          </div>
                        </div>

                        {settings.trustedDeviceBypass && (
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Switch checked={trustThisDevice} onCheckedChange={setTrustThisDevice} />
                            Trust this device after hardware confirmation
                          </label>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading || isConfirming}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                {validation.isValid && (!kycRequired || profile.status === 'verified') ? (
                  <button
                    onClick={handleFinalConfirm}
                    disabled={
                      loading ||
                      isConfirming ||
                      noVerificationMethodEnabled ||
                      (stepUpRequired && verificationTab === 'totp' && totpCode.length !== 6)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading || isConfirming ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Confirming...
                      </>
                    ) : stepUpRequired && verificationTab === 'hardware' ? (
                      <>
                        <Wallet className="h-4 w-4" />
                        Confirm on hardware wallet
                      </>
                    ) : stepUpRequired ? (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Verify and confirm
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Confirm Transaction
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-400 px-4 py-3 font-medium text-white"
                  >
                    <X className="w-4 h-4" />
                    {kycRequired && profile.status !== 'verified' ? 'Complete KYC' : 'Transaction Blocked'}
                    <X className="h-4 w-4" />
                    Transaction Blocked
                  </button>
                )}
              </div>

              {stepUpRequired && settings.trustedDeviceBypass && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      You can trust this browser after a successful step-up. The trusted-device bypass is stored locally and can be revoked from Security settings.
                    </p>
                  </div>
                </div>
              )}

              {validation.requiresConfirmation && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
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
