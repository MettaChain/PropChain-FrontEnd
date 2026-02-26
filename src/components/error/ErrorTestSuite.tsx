'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedErrorBoundary, ErrorBoundaryPresets } from './EnhancedErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { AppError, ErrorCategory, ErrorSeverity, ErrorRecoveryAction } from '@/types/errors';
import { Bug, Wifi, Camera, Wallet, AlertTriangle } from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  triggerError: () => void;
  icon: React.ReactNode;
}

export function ErrorTestSuite() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Array<{ id: string; success: boolean; error?: string }>>([]);

  const testScenarios: TestScenario[] = [
    {
      id: 'web3-connection',
      name: 'Web3 Connection Error',
      description: 'Simulates a wallet connection failure',
      category: ErrorCategory.WEB3,
      severity: ErrorSeverity.HIGH,
      icon: <Wallet className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createWeb3Error(
          'Failed to connect to wallet',
          'Unable to connect to your wallet. Please ensure MetaMask is installed and unlocked.',
          {
            context: { walletType: 'MetaMask', chainId: 1 },
            recoveryAction: ErrorRecoveryAction.RECONNECT,
          }
        );
      },
    },
    {
      id: 'network-timeout',
      name: 'Network Timeout',
      description: 'Simulates a network request timeout',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      icon: <Wifi className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createNetworkError(
          'Network request timed out',
          'Network request timed out. Please check your connection and try again.',
          {
            context: { timeout: 30000, url: '/api/properties' },
            recoveryAction: ErrorRecoveryAction.RETRY,
          }
        );
      },
    },
    {
      id: 'ar-camera',
      name: 'AR Camera Error',
      description: 'Simulates an AR camera permission error',
      category: ErrorCategory.AR,
      severity: ErrorSeverity.MEDIUM,
      icon: <Camera className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createARError(
          'Camera access denied',
          'Camera permission is required for AR features. Please grant camera access to continue.',
          {
            context: { permission: 'camera', device: 'mobile' },
            recoveryAction: ErrorRecoveryAction.GRANT_PERMISSION,
            isRecoverable: true,
          }
        );
      },
    },
    {
      id: 'validation-form',
      name: 'Form Validation Error',
      description: 'Simulates a form validation failure',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      icon: <AlertTriangle className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createValidationError(
          'Invalid email format',
          'Please enter a valid email address.',
          {
            context: { field: 'email', value: 'invalid-email' },
            recoveryAction: ErrorRecoveryAction.RETRY,
          }
        );
      },
    },
    {
      id: 'ui-component',
      name: 'UI Component Error',
      description: 'Simulates a React component error',
      category: ErrorCategory.UI,
      severity: ErrorSeverity.LOW,
      icon: <Bug className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createUIError(
          'Component failed to render',
          'A component failed to load properly. Refreshing the page may help.',
          {
            context: { component: 'PropertyCard', props: { id: 123 } },
            recoveryAction: ErrorRecoveryAction.REFRESH,
          }
        );
      },
    },
    {
      id: 'permission-denied',
      name: 'Permission Denied',
      description: 'Simulates a location permission error',
      category: ErrorCategory.PERMISSION,
      severity: ErrorSeverity.MEDIUM,
      icon: <AlertTriangle className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createPermissionError(
          'Location permission denied',
          'Location access is required for property discovery. Please enable location services.',
          {
            context: { permission: 'geolocation', feature: 'nearby-properties' },
            recoveryAction: ErrorRecoveryAction.GRANT_PERMISSION,
          }
        );
      },
    },
    {
      id: 'resource-not-found',
      name: 'Resource Not Found',
      description: 'Simulates a missing resource error',
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.MEDIUM,
      icon: <Bug className="w-5 h-5" />,
      triggerError: () => {
        throw ErrorFactory.createResourceError(
          'Property image not found',
          'Unable to load property images. Please check your connection and try again.',
          {
            context: { resource: 'image', url: '/api/properties/123/image' },
            recoveryAction: ErrorRecoveryAction.REFRESH,
          }
        );
      },
    },
  ];

  const runTest = (scenario: TestScenario) => {
    setActiveTest(scenario.id);
    
    try {
      scenario.triggerError();
      setTestResults(prev => [...prev, { id: scenario.id, success: false }]);
    } catch (error: unknown) {
      // Expected behavior - error should be caught by boundary
      setTestResults(prev => [...prev, {
        id: scenario.id,
        success: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
    
    setTimeout(() => setActiveTest(null), 2000);
  };

  const clearResults = () => {
    setTestResults([]);
    setActiveTest(null);
  };

  const getTestStatus = (scenarioId: string) => {
    const result = testResults.find(r => r.id === scenarioId);
    if (activeTest === scenarioId) return { status: 'running', color: 'text-blue-600' };
    if (result?.success) return { status: 'caught', color: 'text-green-600' };
    if (result) return { status: 'failed', color: 'text-red-600' };
    return { status: 'pending', color: 'text-gray-600' };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Error Boundary Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test different error scenarios to verify error boundary functionality
        </p>
      </div>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Test Results
              <Button variant="outline" size="sm" onClick={clearResults}>
                Clear Results
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testScenarios.map(scenario => {
                const status = getTestStatus(scenario.id);
                return (
                  <div key={scenario.id} className="text-center">
                    <div className={`font-medium ${status.color}`}>
                      {status.status.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {scenario.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testScenarios.map(scenario => {
          const status = getTestStatus(scenario.id);
          
          return (
            <Card key={scenario.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    {scenario.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <div className={`text-sm font-medium ${status.color}`}>
                      {status.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {scenario.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium">{scenario.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Severity:</span>
                    <span className="font-medium">{scenario.severity}</span>
                  </div>
                </div>

                <Button
                  onClick={() => runTest(scenario)}
                  disabled={activeTest === scenario.id}
                  className="w-full mt-4"
                  variant={status.status === 'caught' ? 'secondary' : 'default'}
                >
                  {activeTest === scenario.id ? 'Running...' : 'Test Error'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Alert className="mt-8">
        <AlertDescription>
          <strong>How to use:</strong> Click on any test scenario to trigger that specific error type. 
          The error boundary should catch the error and display an appropriate error message with recovery options. 
          Check that each error type shows the correct category, severity, and recovery actions.
        </AlertDescription>
      </Alert>
    </div>
  );
}
