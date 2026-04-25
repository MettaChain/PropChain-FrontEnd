"use client";

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChainAwareProvider } from "@/providers/ChainAwareProvider";
import { useWalletPersistence } from "@/utils/walletPersistence";
import { setupExtensionErrorHandling } from "@/utils/extensionDetection";
import { structuredLogger } from "@/utils/structuredLogger";
import { errorMonitoring } from "@/utils/errorMonitoringService";
import { ErrorCategory, ErrorSeverity } from "@/types/errors";
import { logger } from "@/utils/logger";
import { WalletConnector } from "@/components/WalletConnector";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  ChainAware,
  ChainSpecific,
  MultiChainBadge,
  GasEstimation,
  TransactionButton,
} from "@/components/ChainAwareProps";
import { LoadingState } from "@/components/LoadingSpinner";
import { ErrorBoundaryPresets } from "@/components/error/EnhancedErrorBoundary";
import { HeroSection } from "@/components/homepage/HeroSection";
import { WalletInfo } from "@/components/homepage/WalletInfo";
import { ChainFeatures } from "@/components/homepage/ChainFeatures";
import { TransactionDemo } from "@/components/homepage/TransactionDemo";
import { MultiChainFeatures } from "@/components/homepage/MultiChainFeatures";

function HomeContent() {
  const { t } = useTranslation("common");

  useWalletPersistence();

  useEffect(() => {
    setupExtensionErrorHandling();
    
    // Initialize structured logging and error monitoring
    structuredLogger.info('Application initialized', {
      component: 'HomeContent',
      action: 'initialization',
      metadata: { timestamp: new Date().toISOString() },
    });

    // Set up global error handling
    const handleUnhandledError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;
      
      const appError = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        category: ErrorCategory.UI,
        severity: ErrorSeverity.HIGH,
        message: event.message,
        userMessage: 'An unexpected error occurred',
        timestamp: new Date(),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        stack: error.stack,
        isRecoverable: false,
        shouldReport: true,
      };
      
      errorMonitoring.monitorError(appError);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled promise rejection');
      
      const appError = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'A network error occurred',
        timestamp: new Date(),
        context: {
          reason: event.reason,
        },
        stack: error.stack,
        isRecoverable: true,
        shouldReport: true,
      };
      
      errorMonitoring.monitorError(appError);
    };

    // Add global error listeners
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function
    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleSampleTransaction = async () => {
    logger.info('Sample transaction executed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PropChain
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HeroSection />

        <ChainAware
          fallback={
            <div className="text-center py-12">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t("wallet.connectYourWallet")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t("app.subtitle")}
                </p>
                <WalletConnector />
              </div>
            </div>
          }
        >
          {({ chainName, chainSymbol, chainColor, address, balance }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <WalletInfo 
                address={address || undefined} 
                balance={balance || undefined} 
                chainName={chainName} 
                chainSymbol={chainSymbol} 
              />

              <ChainFeatures />

              <TransactionDemo 
                chainName={chainName} 
                onTransaction={handleSampleTransaction} 
              />

              <MultiChainFeatures />
            </div>
          )}
        </ChainAware>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundaryPresets.ui enableRetry maxRetries={3}>
      <ChainAwareProvider>
        <HomeContent />
      </ChainAwareProvider>
    </ErrorBoundaryPresets.ui>
  );
}
