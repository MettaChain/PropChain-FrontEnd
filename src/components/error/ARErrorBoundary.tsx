"use client";

import React, { Component } from "react";
import type { ReactNode } from "react";
import { Camera, Smartphone, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AppError, ErrorBoundaryState } from "@/types/errors";
import { ErrorRecoveryAction, ErrorCategory } from "@/types/errors";
import { ErrorFactory } from "@/utils/errorFactory";
import { errorReporting } from "@/utils/errorReporting";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
  enableRetry?: boolean;
  maxRetries?: number;
}

interface State extends ErrorBoundaryState {
  isARSupported: boolean;
  deviceCapabilities: {
    hasCamera: boolean;
    hasGyroscope: boolean;
    hasAccelerometer: boolean;
  };
}

export class ARErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      isARSupported: false,
      deviceCapabilities: {
        hasCamera: false,
        hasGyroscope: false,
        hasAccelerometer: false,
      },
    };
  }

  componentDidMount() {
    this.checkARSupport();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorFactory.fromError(error, ErrorCategory.AR);
    return {
      hasError: true,
      error: appError,
      errorId: appError.id,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = ErrorFactory.fromError(error, ErrorCategory.AR, {
      componentStack: errorInfo.componentStack ?? undefined,
      context: {
        errorBoundary: "ARErrorBoundary",
        errorInfo,
        arSupported: this.state.isARSupported,
        deviceCapabilities: this.state.deviceCapabilities,
      },
    });

    // Report error
    errorReporting.reportError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }

    this.setState({
      error: appError,
      errorId: appError.id,
    });
  }

  private checkARSupport = async () => {
    if (typeof window === "undefined") return;

    // Check WebXR support
    const isXRSupported = "xr" in navigator;

    // Check device sensors
    const hasCamera = await this.checkCameraAccess();
    const hasGyroscope = "DeviceOrientationEvent" in window;
    const hasAccelerometer = "DeviceMotionEvent" in window;

    const isARSupported =
      isXRSupported && hasCamera && hasGyroscope && hasAccelerometer;

    this.setState({
      isARSupported,
      deviceCapabilities: {
        hasCamera,
        hasGyroscope,
        hasAccelerometer,
      },
    });
  };

  private checkCameraAccess = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  };

  private handleRetry = async () => {
    if (!this.state.error || !this.state.error.isRecoverable) {
      return;
    }

    const maxRetries = this.props.maxRetries || 2;
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRecovering: true });

    try {
      const recovered = await errorReporting.attemptRecovery(this.state.error);

      if (recovered) {
        // Clear error state on successful recovery
        this.setState({
          hasError: false,
          error: null,
          errorId: null,
          retryCount: 0,
          isRecovering: false,
        });
      } else {
        // Increment retry count
        this.setState((prevState) => ({
          retryCount: prevState.retryCount + 1,
          isRecovering: false,
        }));
      }
    } catch (recoveryError) {
      logger.error("AR recovery failed:", recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());

      // Retry AR initialization after permission granted
      this.handleRetry();
    } catch (error) {
      logger.error("Camera permission denied:", error);
    }
  };

  private getCapabilityStatus = (capability: boolean, label: string) => {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${capability ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-sm">{label}</span>
      </div>
    );
  };

  render() {
    // Show AR support warning if AR is not supported
    if (!this.state.isARSupported && !this.state.hasError) {
      return (
        <div className="min-h-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AR Not Supported
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your device doesn't support augmented reality features. Please
                try accessing this page on a compatible device.
              </p>

              <div className="mb-6 text-left">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Device Requirements:
                </h3>
                <div className="space-y-2">
                  {this.getCapabilityStatus(
                    this.state.deviceCapabilities.hasCamera,
                    "Camera Access",
                  )}
                  {this.getCapabilityStatus(
                    this.state.deviceCapabilities.hasGyroscope,
                    "Gyroscope",
                  )}
                  {this.getCapabilityStatus(
                    this.state.deviceCapabilities.hasAccelerometer,
                    "Accelerometer",
                  )}
                  {this.getCapabilityStatus("xr" in navigator, "WebXR Support")}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-purple-200 dark:border-purple-800">
            <div className="p-6">
              {/* Error Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AR Feature Error
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <Alert variant="default" className="mb-6">
                <AlertDescription className="text-sm">
                  {this.state.error.userMessage ||
                    "AR feature encountered an error. Your device may not support augmented reality."}
                </AlertDescription>
              </Alert>

              {/* Technical Details (Development) */}
              {process.env.NODE_ENV === "development" &&
                this.state.error.technicalDetails && (
                  <details className="mb-6">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                      {this.state.error.technicalDetails}
                    </pre>
                  </details>
                )}

              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {this.props.enableRetry && this.state.error.isRecoverable && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={
                      this.state.isRecovering ||
                      this.state.retryCount >= (this.props.maxRetries || 2)
                    }
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${this.state.isRecovering ? "animate-spin" : ""}`}
                    />
                    {this.state.isRecovering
                      ? "Retrying..."
                      : `Retry (${this.state.retryCount}/${this.props.maxRetries || 2})`}
                  </Button>
                )}

                {this.state.error.recoveryAction ===
                  ErrorRecoveryAction.GRANT_PERMISSION && (
                  <Button
                    onClick={this.requestCameraPermission}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Grant Camera Permission
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>

              {/* Device Information */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Device Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      AR Support:
                    </span>
                    <span
                      className={`font-medium ${this.state.isARSupported ? "text-green-600" : "text-red-600"}`}
                    >
                      {this.state.isARSupported ? "Supported" : "Not Supported"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Camera:
                    </span>
                    <span
                      className={`font-medium ${this.state.deviceCapabilities.hasCamera ? "text-green-600" : "text-red-600"}`}
                    >
                      {this.state.deviceCapabilities.hasCamera
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Sensors:
                    </span>
                    <span
                      className={`font-medium ${this.state.deviceCapabilities.hasGyroscope && this.state.deviceCapabilities.hasAccelerometer ? "text-green-600" : "text-red-600"}`}
                    >
                      {this.state.deviceCapabilities.hasGyroscope &&
                      this.state.deviceCapabilities.hasAccelerometer
                        ? "Available"
                        : "Limited"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Help Tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  AR Troubleshooting
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Ensure camera permissions are granted</li>
                  <li>• Use a modern browser (Chrome, Safari, Firefox)</li>
                  <li>• Check if your device supports AR features</li>
                  <li>• Try moving to a well-lit area</li>
                  <li>• Clear browser cache and reload</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
