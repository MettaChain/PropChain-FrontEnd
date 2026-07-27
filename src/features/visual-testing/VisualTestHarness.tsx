import React from 'react';
import { VisualTestHarnessProps } from './visualTestingTypes';
import { useVisualTestHarness } from './useVisualTestHarness';

/**
 * A testing harness wrapper designed specifically to mount various modals
 * and force specific viewport/theme states to enable deterministic
 * visual regression snapshots via Playwright/Storybook.
 */
export function VisualTestHarness({ 
  children, 
  activeModal = 'NONE', 
  breakpoint = 'DESKTOP', 
  theme = 'light' 
}: VisualTestHarnessProps) {
  useVisualTestHarness(activeModal, breakpoint);

  const getWidth = () => {
    switch (breakpoint) {
      case 'MOBILE': return 'w-[375px]';
      case 'TABLET': return 'w-[768px]';
      case 'DESKTOP': return 'w-[1280px]';
      default: return 'w-full';
    }
  };

  return (
    <div 
      className={`visual-test-harness mx-auto min-h-screen ${getWidth()} ${theme === 'dark' ? 'bg-gray-900 text-white dark' : 'bg-white text-gray-900'}`}
      data-testid="visual-test-harness"
      data-active-modal={activeModal}
      data-theme={theme}
      data-breakpoint={breakpoint}
    >
      <div className="p-8">
        <h1 className="text-xl font-bold mb-4 opacity-50">Visual Test Harness ({breakpoint} - {theme})</h1>
        {children}
        
        {/* Render mocked modals based on state for easy snapshots */}
        {activeModal === 'WALLET' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-bold mb-4">Connect Wallet</h2>
              <div className="space-y-3">
                <button className="w-full py-3 px-4 border border-gray-300 rounded hover:bg-gray-50 flex items-center">
                  <span className="flex-1 text-left">MetaMask</span>
                </button>
                <button className="w-full py-3 px-4 border border-gray-300 rounded hover:bg-gray-50 flex items-center">
                  <span className="flex-1 text-left">WalletConnect</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'TRANSACTION' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-center">Confirm Transaction</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold">1,500 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gas Fee</span>
                  <span>~0.005 ETH</span>
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">Confirm</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
