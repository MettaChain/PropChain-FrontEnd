import React, { Component, ErrorInfo } from 'react';
import { Web3ErrorBoundaryProps, Web3ErrorBoundaryState } from './web3ErrorTypes';
import { useWeb3ErrorStore } from './web3ErrorStore';

export class Web3ErrorBoundary extends Component<Web3ErrorBoundaryProps, Web3ErrorBoundaryState> {
  constructor(props: Web3ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Web3ErrorBoundaryState {
    // Determine if it's a web3 related error by looking at the message
    if (error.message.includes('gas') || error.message.includes('wallet') || error.message.includes('Web3')) {
      return {
        hasError: true,
        error: { type: 'UNKNOWN', message: error.message }
      };
    }
    return { hasError: true, error: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Web3ErrorBoundary caught an error:', error, errorInfo);
    // Ideally report to Sentry/DataDog here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    useWeb3ErrorStore.getState().clearError();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <div onClick={this.handleReset}>{this.props.fallback}</div>;
      }
      
      return (
        <div className="web3-error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-700 font-bold mb-2">Web3 Transaction Failed</h2>
          <p className="text-red-600 mb-4">{this.state.error?.message || 'An unexpected blockchain error occurred.'}</p>
          <button 
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
