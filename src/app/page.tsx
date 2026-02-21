"use client";

import React, { useEffect } from "react";
import { useWalletPersistence } from "@/utils/walletPersistence";
import { setupExtensionErrorHandling } from "@/utils/extensionDetection";
import {
  setupConsoleOverride,
  suppressExtensionErrors,
} from "@/utils/consoleOverride";
import {
  ManualErrorSuppressor,
  globalErrorSuppressor,
} from "@/utils/manualErrorSuppressor";
import { WalletConnector } from "@/components/WalletConnector";
import {
  ChainAware,
  ChainSpecific,
  MultiChainBadge,
  GasEstimation,
  TransactionButton,
} from "@/components/ChainAwareProps";
import { LoadingState } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function HomeContent() {
  useWalletPersistence();

  useEffect(() => {
    setupExtensionErrorHandling();
    setupConsoleOverride();
    suppressExtensionErrors();
    ManualErrorSuppressor();
    globalErrorSuppressor();

    // Make manual suppressor available globally
    (window as any).suppressErrors = () => {
      console.clear();
      console.log("🔧 Manual error suppression activated");
    };
  }, []);

  const handleSampleTransaction = async () => {
    console.log("Sample transaction executed");
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
            <WalletConnector />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Multi-Chain Real Estate Platform
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience seamless wallet connectivity across Ethereum, Polygon, and Binance Smart Chain
          </p>
          <a
            href="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Properties
          </a>
        </div>

        <ChainAware
          fallback={
            <div className="text-center py-12">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Connect your Web3 wallet to access multi-chain real estate
                  features
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
                  Wallet Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Address
                    </p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {address?.slice(0, 8)}...{address?.slice(-6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Balance
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {balance} {chainSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Network
                    </p>
                    <MultiChainBadge>
                      <span className="text-sm">{chainName}</span>
                    </MultiChainBadge>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Chain-Specific Features
                </h3>
                <ChainSpecific chainId={1}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <span className="text-sm font-medium">
                        Ethereum Mainnet
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      High security, extensive DeFi ecosystem
                    </p>
                    <GasEstimation />
                  </div>
                </ChainSpecific>

                <ChainSpecific chainId={137}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-600" />
                      <span className="text-sm font-medium">Polygon</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Low fees, fast transactions
                    </p>
                    <GasEstimation />
                  </div>
                </ChainSpecific>

                <ChainSpecific chainId={56}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">BSC</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Low fees, high throughput
                    </p>
                    <GasEstimation />
                  </div>
                </ChainSpecific>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sample Transaction
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Test a sample transaction on {chainName}
                  </p>
                  <TransactionButton onTransaction={handleSampleTransaction}>
                    Execute Transaction
                  </TransactionButton>
                  <GasEstimation gasLimit="50000" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Multi-Chain Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">🔗</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Multi-Wallet Support
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      MetaMask, WalletConnect, Coinbase
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">⚡</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Network Switching
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Seamless chain switching
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">💾</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Persistent State
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connection survives refreshes
                    </p>
                  </div>
                </div>

                {/* Mobile Properties Link */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      📱 Mobile-First Property Experience
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Experience our touch-optimized property viewing with AR
                      preview, location discovery, and offline support
                    </p>
                    <a
                      href="/mobile-properties"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <span className="mr-2">📱</span>
                      View Mobile Properties
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ChainAware>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}
