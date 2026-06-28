'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorFactory } from '@/utils/errorFactory';
import { ErrorCategory, ErrorSeverity, ErrorRecoveryAction } from '@/types/errors';
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

interface TestResult {
  id: string;
  success: boolean;
  error?: string;
}

type TestStatus = 'running' | 'caught' | 'failed' | 'pending';

interface ScenarioStatus {
  status: TestStatus;
  color: string;
}

const TEST_SCENARIOS: TestScenario[] = [
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

const getScenarioStatus = (
  scenarioId: string,
  activeTest: string | null,
  resultMap: Map<string, TestResult>
): ScenarioStatus => {
  if (activeTest === scenarioId) {
    return { status: 'running', color: 'text-blue-600' };
  }

  const result = resultMap.get(scenarioId);

  if (!result) {
    return { status: 'pending', color: 'text-gray-600' };
  }

  return result.success
    ? { status: 'caught', color: 'text-green-600' }
    : { status: 'failed', color: 'text-red-600' };
};

const SummaryCard = memo(
  ({
    scenarioName,
    status,
    color,
  }: {
    scenarioName: string;
    status: TestStatus;
    color: string;
  }) => (
    <div className="text-center">
      <div className={`font-medium ${color}`}>{status.toUpperCase()}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{scenarioName}</div>
    </div>
  )
);
SummaryCard.displayName = 'SummaryCard';

const ScenarioCard = memo(
  ({
    scenario,
    status,
    color,
    onRun,
  }: {
    scenario: TestScenario;
    status: TestStatus;
    color: string;
    onRun: () => void;
  }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            {scenario.icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{scenario.name}</CardTitle>
            <div className={`text-sm font-medium ${status.color}`}>{status.status.toUpperCase()}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{scenario.description}</p>

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
          onClick={onRun}
          disabled={status === 'running'}
          className="w-full mt-4"
          variant={status === 'caught' ? 'secondary' : 'default'}
        >
          {status === 'running' ? 'Running...' : 'Test Error'}
        </Button>
      </CardContent>
    </Card>
  )
);
ScenarioCard.displayName = 'ScenarioCard';

export function ErrorTestSuite() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Array<TestResult>>([]);

  const testResultsMap = useMemo(
    () => new Map(testResults.map(result => [result.id, result])),
    [testResults]
  );

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scenarioStatusMap = useMemo(() => {
    const map = new Map<string, ScenarioStatus>();

    TEST_SCENARIOS.forEach(scenario => {
      map.set(scenario.id, getScenarioStatus(scenario.id, activeTest, testResultsMap));
    });

    return map;
  }, [activeTest, testResultsMap]);

  const runTest = useCallback((scenario: TestScenario) => {
    setActiveTest(scenario.id);

    try {
      scenario.triggerError();
      setTestResults(prev => [...prev, { id: scenario.id, success: false }]);
    } catch (error: unknown) {
      setTestResults(prev => [
        ...prev,
        {
          id: scenario.id,
          success: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ]);
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setActiveTest(null), 2000);
  }, []);

  const runTestCallbacks = useMemo(
    () =>
      new Map(TEST_SCENARIOS.map(scenario => [scenario.id, () => runTest(scenario)])),
    [runTest]
  );

  const clearResults = useCallback(() => {
    setTestResults([]);
    setActiveTest(null);
  }, []);

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
              {TEST_SCENARIOS.map(scenario => {
                const status = scenarioStatusMap.get(scenario.id)!;
                return (
                  <SummaryCard
                    key={scenario.id}
                    scenarioName={scenario.name}
                    status={status.status}
                    color={status.color}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEST_SCENARIOS.map(scenario => {
          const status = scenarioStatusMap.get(scenario.id)!;

          return (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              status={status.status}
              color={status.color}
              onRun={runTestCallbacks.get(scenario.id)!}
            />
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
