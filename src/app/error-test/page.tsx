'use client';

import { ErrorTestSuite } from '@/components/error/ErrorTestSuite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedErrorBoundary, ErrorBoundaryPresets } from '@/components/error/EnhancedErrorBoundary';
import { Button } from '@/components/ui/button';
import { ErrorCategory } from '@/types/errors';
import { WalletConnector } from '@/components/WalletConnector';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function ErrorDemo() {
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
                Error Boundary Demo
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
            Error Handling Demonstration
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test comprehensive error boundaries with contextual error handling and recovery strategies
          </p>
        </div>

        {/* Error Test Suite */}
        <ErrorTestSuite />

        {/* Individual Error Boundary Examples */}
        <div className="mt-16 space-y-12">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Individual Error Boundary Examples
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Web3 Error Boundary */}
              <Card>
                <CardHeader>
                  <CardTitle>Web3 Error Boundary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Handles blockchain-related errors with wallet reconnection options.
                  </p>
                  <ErrorBoundaryPresets.web3 enableRetry maxRetries={3}>
                    <Button
                      onClick={() => {
                        throw new Error('Simulated Web3 connection failure');
                      }}
                      className="w-full"
                    >
                      Trigger Web3 Error
                    </Button>
                  </ErrorBoundaryPresets.web3>
                </CardContent>
              </Card>

              {/* Network Error Boundary */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Error Boundary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Handles network connectivity issues with retry mechanisms.
                  </p>
                  <ErrorBoundaryPresets.network enableRetry maxRetries={5}>
                    <Button
                      onClick={() => {
                        throw new Error('Simulated network timeout');
                      }}
                      className="w-full"
                    >
                      Trigger Network Error
                    </Button>
                  </ErrorBoundaryPresets.network>
                </CardContent>
              </Card>

              {/* AR Error Boundary */}
              <Card>
                <CardHeader>
                  <CardTitle>AR Error Boundary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Handles AR/VR feature errors with device capability checks.
                  </p>
                  <ErrorBoundaryPresets.ar enableRetry maxRetries={2}>
                    <Button
                      onClick={() => {
                        throw new Error('Simulated AR camera access denied');
                      }}
                      className="w-full"
                    >
                      Trigger AR Error
                    </Button>
                  </ErrorBoundaryPresets.ar>
                </CardContent>
              </Card>

              {/* UI Error Boundary */}
              <Card>
                <CardHeader>
                  <CardTitle>UI Error Boundary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Handles general UI component errors with graceful degradation.
                  </p>
                  <ErrorBoundaryPresets.ui enableRetry maxRetries={3}>
                    <Button
                      onClick={() => {
                        throw new Error('Simulated UI component failure');
                      }}
                      className="w-full"
                    >
                      Trigger UI Error
                    </Button>
                  </ErrorBoundaryPresets.ui>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Graceful Degradation Example */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Graceful Degradation Example
            </h3>
            <Card>
              <CardHeader>
                <CardTitle>Fallback Component</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Shows how non-critical features can degrade gracefully.
                </p>
                <ErrorBoundaryPresets.ui
                  gracefulDegradation={{
                    fallbackComponent: (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Feature Unavailable
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          This feature is currently unavailable, but you can continue using other parts of the application.
                        </p>
                      </div>
                    )
                  }}
                >
                  <Button
                    onClick={() => {
                      throw new Error('Non-critical feature error');
                    }}
                    className="w-full"
                  >
                    Trigger Graceful Degradation
                  </Button>
                </ErrorBoundaryPresets.ui>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ErrorDemo;
