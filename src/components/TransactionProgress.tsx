'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, XCircle, Wallet, Broadcast, Clock, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation('common');
  const [steps, setSteps] = useState<TransactionStep[]>([
    {
      id: 'sign',
      label: 'Signing Transaction',
      description: 'Please sign the transaction in your wallet',
      status: 'pending',
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      id: 'broadcast',
      label: 'Broadcasting to Network',
      description: 'Transaction is being sent to the blockchain',
      status: 'pending',
      icon: <Broadcast className="w-4 h-4" />,
    },
    {
      id: 'confirm',
      label: 'Waiting for Confirmation',
      description: 'Transaction is being confirmed by the network',
      status: 'pending',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'complete',
      label: 'Transaction Confirmed',
      description: 'Transaction has been successfully completed',
      status: 'pending',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ]);

  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations] = useState(12);
  const [currentStep, setCurrentStep] = useState(0);

  const isRTL = i18n.language === 'ar' || i18n.language === 'he';

  useEffect(() => {
    if (!isOpen) return;

    const simulateProgress = async () => {
      await updateStepStatus('sign', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateStepStatus('sign', 'completed');
      setCurrentStep(1);

      await updateStepStatus('broadcast', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await updateStepStatus('broadcast', 'completed');
      setCurrentStep(2);

      await updateStepStatus('confirm', 'in-progress');
      
      for (let i = 1; i <= requiredConfirmations; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConfirmations(i);
      }
      
      await updateStepStatus('confirm', 'completed');
      setCurrentStep(3);

      await updateStepStatus('complete', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await updateStepStatus('complete', 'completed');
      
      if (onComplete) {
        onComplete();
      }
    };

    simulateProgress().catch(error => {
      console.error('Transaction simulation error:', error);
      if (onError) {
        onError('Transaction failed. Please try again.');
      }
    });
  }, [isOpen, requiredConfirmations, onComplete, onError]);

  const updateStepStatus = async (stepId: string, status: TransactionStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getConfirmationProgress = () => {
    return (confirmations / requiredConfirmations) * 100;
  };

  const isCompleted = steps[steps.length - 1].status === 'completed';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('transactionProgress.title')}
                  </h3>
                  {transactionHash && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                      {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label={t('transactionProgress.closeAria')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">{t('transactionProgress.overallProgress')}</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>

              <div className="space-y-4 mb-6">
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
                      
                      {step.id === 'confirm' && step.status === 'in-progress' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">
                              {t('transactionProgress.blockConfirmations')}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {confirmations}/{requiredConfirmations}
                            </span>
                          </div>
                          <Progress value={getConfirmationProgress()} className="h-1" />
                        </div>
                      )}
                      
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                          {step.error}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Shield className="w-3 h-3" />
                  <span>{t('transactionProgress.securedByBlockchain')}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={!isCompleted}
                >
                  {isCompleted ? t('transactionProgress.close') : t('transactionProgress.processing')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export function useTransactionProgress() {
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
}
