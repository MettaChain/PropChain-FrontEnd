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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("app.tagline")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("app.subtitle")}
          </p>
          <a
            href="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {t("navigation.browseProperties")}
          </a>
        </div>

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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("wallet.walletInformation")}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("wallet.address")}
                    </p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {address?.slice(0, 8)}...{address?.slice(-6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("wallet.balance")}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {balance} {chainSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("wallet.network")}
                    </p>
                    <MultiChainBadge>
                      <span className="text-sm">{chainName}</span>
                    </MultiChainBadge>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("chains.chainSpecificFeatures")}
                </h3>
                <ChainSpecific chainId={1}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <span className="text-sm font-medium">
                        {t("chains.ethereum")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("chains.ethereumDescription")}
                    </p>
                    <GasEstimation />
                  </div>
                </ChainSpecific>

                <ChainSpecific chainId={137}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-600" />
                      <span className="text-sm font-medium">
                        {t("chains.polygon")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("chains.polygonDescription")}
                    </p>
                    <GasEstimation />
                  </div>
                </ChainSpecific>

                <ChainSpecific chainId={56}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">
                        {t("chains.bsc")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("chains.bscDescription")}
                    </p>
                    <GasEstimation />
                  </div>
                </ChainSpecific>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("transactions.sampleTransaction")}
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t("transactions.executeTransaction")} {chainName}
                  </p>
                  <TransactionButton onTransaction={handleSampleTransaction}>
                    {t("transactions.executeTransaction")}
                  </TransactionButton>
                  <GasEstimation gasLimit="50000" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("chains.multiChainFeatures")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">🔗</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {t("wallet.multiWalletSupport")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      MetaMask, WalletConnect, Coinbase
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">⚡</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {t("wallet.networkSwitching")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("chains.seamlessChainSwitching")}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">💾</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {t("wallet.persistentState")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("chains.connectionSurvivesRefreshes")}
                    </p>
                  </div>
                </div>

                {/* Mobile Properties Link */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      📱 {t("mobile.mobileFirstPropertyExperience")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {t("mobile.touchOptimizedPropertyViewing")}
                    </p>
                    <a
                      href="/mobile-properties"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <span className="mr-2">📱</span>
                      {t("navigation.viewMobileProperties")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ChainAware>

        {/* Feature links — Issues #75, #76, #85, #89 */}
        <nav aria-label="Platform features" className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/properties', emoji: '🏠', label: 'Browse Properties', desc: 'Shareable property pages with QR codes' },
            { href: '/governance', emoji: '🗳️', label: 'Governance', desc: 'Vote on property management decisions' },
            { href: '/tax-report', emoji: '📄', label: 'Tax Reports', desc: 'Form 8949 & Schedule D PDF export' },
            { href: '/accessibility', emoji: '♿', label: 'Accessibility', desc: 'WCAG 2.1 AA compliance demo' },
          ].map(({ href, emoji, label, desc }) => (
            <a
              key={href}
              href={href}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="text-2xl mb-2" aria-hidden="true">{emoji}</div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
            </a>
          ))}
        </nav>
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
