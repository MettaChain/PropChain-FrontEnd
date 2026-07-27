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
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
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
import { RecentlyViewed } from "@/components/RecentlyViewed";

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
              <h1
                className="font-bold text-gray-900 dark:text-white"
                style={{ fontSize: 'clamp(1.125rem, 2vw + 0.5rem, 1.25rem)' }}
              >
                PropChain
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
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
            <section className="text-center py-12" aria-labelledby="connect-wallet-heading">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md mx-auto">
                <h2
                  id="connect-wallet-heading"
                  className="font-semibold text-gray-900 dark:text-white mb-4"
                  style={{ fontSize: 'clamp(1.125rem, 2vw + 0.5rem, 1.5rem)' }}
                >
                  {t("wallet.connectYourWallet")}
                </h2>
                <p
                  className="text-gray-600 dark:text-gray-300 mb-6"
                  style={{ fontSize: 'clamp(0.875rem, 1vw + 0.5rem, 1rem)' }}
                >
                  {t("app.subtitle")}
                </p>

                <div className="space-y-3">
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    Install MetaMask
                  </a>
                  <a
                    href="https://www.coinbase.com/wallet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Get Coinbase Wallet
                  </a>
                  <a
                    href="https://walletconnect.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  >
                    WalletConnect
                  </a>
                </div>

                <details className="mt-6 text-left">
                  <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                    What is a wallet?
                  </summary>
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p>
                      A crypto wallet is a digital tool that lets you store, send, and receive
                      cryptocurrency. It also lets you interact with decentralized applications
                      like PropChain.
                    </p>
                    <p>
                      Popular options include{' '}
                      <a
                        href="https://metamask.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        MetaMask
                      </a>{' '}
                      (browser extension),{' '}
                      <a
                        href="https://www.coinbase.com/wallet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Coinbase Wallet
                      </a>{' '}
                      (mobile &amp; browser), and{' '}
                      <a
                        href="https://walletconnect.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        WalletConnect
                      </a>{' '}
                      (connects any mobile wallet).
                    </p>
                  </div>
                </details>
              </div>
            </section>
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
              <p
                className="font-semibold text-gray-900 dark:text-white"
                style={{ fontSize: 'clamp(0.75rem, 1vw + 0.25rem, 0.875rem)' }}
              >
                {label}
              </p>
              <p
                className="text-gray-500 dark:text-gray-400 mt-1"
                style={{ fontSize: 'clamp(0.625rem, 0.8vw + 0.25rem, 0.75rem)' }}
              >
                {desc}
              </p>
            </a>
          ))}
        </nav>

        {/* Recently Viewed Properties */}
        <RecentlyViewed />
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
