'use client';
import { logger } from '@/utils/logger';

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, AlertCircle, XCircle, Wallet, Broadcast, Clock, Shield, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Web3Tooltip } from '@/components/ui/Web3Tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TransactionStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  icon: React.ReactNode;
  error?: string;
}

interface TransactionProgressProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash?: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const TransactionProgress: React.FC<TransactionProgressProps> = memo(({
  isOpen,
  onClose,
  transactionHash,
  onComplete,
  onError,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [steps, setSteps] = useState<TransactionStep[]>([
    {
      id: 'sign',
      label: 'Signing Transaction',
      description: 'Please sign the transaction in your wallet',
      status: 'pending',
      icon: <Wallet className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'broadcast',
      label: 'Broadcasting to Network',
      description: 'Transaction is being sent to the blockchain',
      status: 'pending',
      icon: <Broadcast className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'confirm',
      label: 'Waiting for Confirmation',
      description: 'Transaction is being confirmed by the network',
      status: 'pending',
      icon: <Clock className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'complete',
      label: 'Transaction Confirmed',
      description: 'Transaction has been successfully completed',
      status: 'pending',
      icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
    },
  ]);

  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations] = useState(12);
  const [currentStep, setCurrentStep] = useState(0);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap and initial focus
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button when modal opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Trap focus within modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) || [];
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate transaction progress
    const simulateProgress = async () => {
      // Step 1: Signing
      await updateStepStatus('sign', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateStepStatus('sign', 'completed');
      setCurrentStep(1);

      // Step 2: Broadcasting
      await updateStepStatus('broadcast', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await updateStepStatus('broadcast', 'completed');
      setCurrentStep(2);

      // Step 3: Confirmations
      await updateStepStatus('confirm', 'in-progress');
      
      // Simulate block confirmations
      for (let i = 1; i <= requiredConfirmations; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConfirmations(i);
      }
      
      await updateStepStatus('confirm', 'completed');
      setCurrentStep(3);

      // Step 4: Complete
      await updateStepStatus('complete', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await updateStepStatus('complete', 'completed');
      
      if (onComplete) {
        onComplete();
      }
    };

    simulateProgress().catch(error => {
      logger.error('Transaction simulation error:', error);
      if (onError) {
        onError('Transaction failed. Please try again.');
      }
    });
  }, [isOpen, requiredConfirmations, onComplete, onError]);

  const updateStepStatus = async (stepId: string, status: TransactionStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status }
        : step
    ));
  };

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" aria-hidden="true" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" aria-hidden="true" />;
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getConfirmationProgress = () => {
    return (confirmations / requiredConfirmations) * 100;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Transaction in Progress</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 -mr-2"
            >
              ×
            </Button>
          </DialogTitle>
          {transactionHash && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
              {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
            </p>
          )}
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="px-0 py-2">
            {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span 
                    className="text-gray-900 dark:text-white font-medium"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage()} 
                  className="h-2"
                  aria-label="Overall transaction progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(getProgressPercentage())}
                />
              </div>

              {/* Steps */}
              <div 
                className="space-y-4 mb-6"
                role="list"
                aria-label="Transaction steps"
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      step.status === 'in-progress' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : step.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                    role="listitem"
                    aria-current={step.status === 'in-progress' ? 'step' : undefined}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {step.description}
                      </p>
                      <span 
                        className="sr-only"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        Status: {step.status.replace('-', ' ')}
                      </span>
                      
                      {/* Confirmation Progress */}
                      {step.id === 'confirm' && step.status === 'in-progress' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">
                              <Web3Tooltip term="block confirmation">Block Confirmations</Web3Tooltip>
                            </span>
                            <span 
                              className="text-gray-700 dark:text-gray-300 font-medium"
                              aria-live="polite"
                            >
                              {confirmations} of {requiredConfirmations} confirmations
                            </span>
                          </div>
                          <Progress 
                            value={getConfirmationProgress()} 
                            className="h-1"
                            aria-label="Block confirmations progress"
                            aria-valuemin={0}
                            aria-valuemax={requiredConfirmations}
                            aria-valuenow={confirmations}
                          />
                        </div>
                      )}
                      
                      {step.error && (
                        <div 
                          className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400"
                          role="alert"
                          aria-live="assertive"
                        >
                          {step.error}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Shield className="w-3 h-3" aria-hidden="true" />
                  <span>Secured by blockchain</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={steps[steps.length - 1].status !== 'completed'}
                  aria-label={steps[steps.length - 1].status === 'completed' ? 'Close transaction progress' : 'Transaction in progress, please wait'}
                >
                  {steps[steps.length - 1].status === 'completed' ? 'Close' : 'Processing...'}
                </Button>
              </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
});

// Hook to use transaction progress
export const useTransactionProgress = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>();

  const startTransaction = (hash?: string) => {
    setTransactionHash(hash);
    setIsOpen(true);
  };

  const closeTransaction = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    transactionHash,
    startTransaction,
    closeTransaction,
  };
};
