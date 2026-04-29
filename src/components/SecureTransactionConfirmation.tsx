'use client';
import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  X, 
  Eye, 
  EyeOff, 
  Info,
  FileSignature,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useSecureTransaction } from '@/hooks/useSecureTransaction';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  validateTransactionParameters,
  type TransactionTypedData 
} from '@/utils/eip712/eip712Signing';
import { toast } from 'sonner';

interface SecureTransactionConfirmationProps {
  isOpen: boolean;
  transaction: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  };
  onConfirm: (txHash: string) => void;
  onCancel: () => void;
  signer?: ethers.JsonRpcSigner;
}

export const SecureTransactionConfirmation: React.FC<SecureTransactionConfirmationProps> = ({
  isOpen,
  transaction,
  onConfirm,
  onCancel,
  signer,
}) => {
  const { address, chainId } = useWalletStore();
  const { 
    signAndVerifyTransaction, 
    broadcastTransaction, 
    validateTransaction,
    isSigning, 
    isBroadcasting 
  } = useSecureTransaction();

  const [validation, setValidation] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [signedTransaction, setSignedTransaction] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'validation' | 'signing' | 'broadcast'>('validation');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && transaction) {
      validateTransactionData();
    }
  }, [isOpen, transaction]);

  useEffect(() => {
    // Update progress based on current step
    switch (currentStep) {
      case 'validation':
        setProgress(25);
        break;
      case 'signing':
        setProgress(50);
        break;
      case 'broadcast':
        setProgress(75);
        break;
      default:
        setProgress(0);
    }
  }, [currentStep]);

  const validateTransactionData = () => {
    const transactionData: TransactionTypedData = {
      to: transaction.to,
      value: transaction.value || '0',
      data: transaction.data || '0x',
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
    };

    const result = validateTransactionParameters(transactionData);
    setValidation(result);
  };

  const handleSignAndVerify = async () => {
    if (!signer || !address || !chainId) {
      toast.error('Wallet not properly connected');
      return;
    }

    setCurrentStep('signing');
    
    try {
      const signed = await signAndVerifyTransaction(
        {
          to: transaction.to,
          value: transaction.value || '0',
          data: transaction.data || '0x',
          gasLimit: transaction.gasLimit,
          gasPrice: transaction.gasPrice,
          type: 'transfer',
          description: 'Secure transaction',
        },
        signer
      );

      if (signed) {
        setSignedTransaction(signed);
        toast.success('Transaction signed and verified', {
          description: 'Ready to broadcast to network'
        });
      }
    } catch (error) {
      logger.error('Signing failed:', error);
      setCurrentStep('validation');
    }
  };

  const handleBroadcast = async () => {
    if (!signedTransaction || !signer) {
      toast.error('No signed transaction available');
      return;
    }

    setCurrentStep('broadcast');
    
    try {
      const txHash = await broadcastTransaction(signedTransaction, signer);
      if (txHash) {
        onConfirm(txHash);
      }
    } catch (error) {
      logger.error('Broadcast failed:', error);
      setCurrentStep('signing');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatEth = (wei: string) => {
    return parseFloat(ethers.formatEther(wei || '0')).toFixed(6);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRiskLevelBg = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const canProceed = validation?.isValid && !isSigning && !isBroadcasting;
  const canBroadcast = signedTransaction && signedTransaction.verified && !isBroadcasting;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Transaction Confirmation
          </DialogTitle>
          <DialogDescription>
            Review transaction details and complete EIP-712 signature verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Transaction Security Process</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span className={currentStep === 'validation' ? 'font-semibold text-blue-600' : ''}>
                Validation
              </span>
              <span className={currentStep === 'signing' ? 'font-semibold text-blue-600' : ''}>
                EIP-712 Signing
              </span>
              <span className={currentStep === 'broadcast' ? 'font-semibold text-blue-600' : ''}>
                Broadcast
              </span>
            </div>
          </div>

          {/* Security Assessment */}
          {validation && (
            <Card className={getRiskLevelBg(validation.isValid ? 'low' : 'critical')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {validation.isValid ? (
                    <Shield className={`h-5 w-5 ${getRiskLevelColor('low')}`} />
                  ) : (
                    <AlertTriangle className={`h-5 w-5 ${getRiskLevelColor('critical')}`} />
                  )}
                  Security Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={validation.isValid ? "default" : "destructive"}>
                    {validation.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
                
                {(validation.warnings.length > 0 || validation.risks.length > 0) && (
                  <div className="space-y-2">
                    {validation.warnings.length > 0 && (
                      <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Warnings
                            </p>
                            {validation.warnings.map((warning: string, index: number) => (
                              <p key={index} className="text-xs text-yellow-700 dark:text-yellow-300">
                                • {warning}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {validation.risks.length > 0 && (
                      <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3">
                        <div className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                              Risk Factors
                            </p>
                            {validation.risks.map((risk: string, index: number) => (
                              <p key={index} className="text-xs text-orange-700 dark:text-orange-300">
                                • {risk}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base">Transaction Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {showDetails && (
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="font-mono text-sm">{formatAddress(transaction.to)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">{transaction.to}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                  <span className="text-sm font-medium">{formatEth(transaction.value)} ETH</span>
                </div>
                
                {transaction.gasLimit && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gas Limit:</span>
                    <span className="text-sm">{transaction.gasLimit}</span>
                  </div>
                )}
                
                {transaction.gasPrice && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gas Price:</span>
                    <span className="text-sm">{formatEth(transaction.gasPrice)} ETH</span>
                  </div>
                )}
                
                {transaction.data && transaction.data !== '0x' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Data:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRawData(!showRawData)}
                      >
                        {showRawData ? 'Hide' : 'Show'} Raw
                      </Button>
                    </div>
                    {showRawData ? (
                      <div className="break-all font-mono text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {transaction.data}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Contract interaction ({transaction.data.length} bytes)
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* EIP-712 Signing Status */}
          {signedTransaction && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSignature className="h-5 w-5 text-green-600 dark:text-green-400" />
                  EIP-712 Signature Verified
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Signer:</span>
                  <span className="font-mono">{formatAddress(signedTransaction.signer)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Domain:</span>
                  <span>{signedTransaction.domain.name} v{signedTransaction.domain.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
                  <span>{signedTransaction.domain.chainId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                  <span>{new Date(signedTransaction.timestamp).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSigning || isBroadcasting}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {!signedTransaction ? (
              <Button
                onClick={handleSignAndVerify}
                disabled={!canProceed}
                className="flex-1"
              >
                {isSigning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Signing...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 mr-2" />
                    Sign & Verify
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleBroadcast}
                disabled={!canBroadcast}
                className="flex-1"
              >
                {isBroadcasting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Broadcast Transaction
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Security Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  EIP-712 Security
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This transaction uses EIP-712 typed data signing for enhanced security. 
                  The signature is cryptographically bound to the specific transaction parameters, 
                  preventing unauthorized modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
