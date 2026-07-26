import { useState, useCallback } from 'react';
import { Web3Error } from './web3ErrorTypes';
import { useWeb3ErrorStore } from './web3ErrorStore';

export function useWeb3Error() {
  const { lastError, setLastError, clearError } = useWeb3ErrorStore();

  const handleWeb3Error = useCallback((error: any) => {
    let parsedError: Web3Error = { type: 'UNKNOWN', message: 'An unknown Web3 error occurred' };

    // Rudimentary parsing based on typical wallet error codes
    if (error?.code === 4001) {
      parsedError = { type: 'WALLET_DISCONNECTED', message: 'User rejected the request', code: 4001 };
    } else if (error?.message?.includes('insufficient funds') || error?.code === -32000) {
      parsedError = { type: 'INSUFFICIENT_GAS', message: 'Insufficient funds for gas', code: -32000 };
    } else if (error?.message?.includes('chain ID')) {
      parsedError = { type: 'CHAIN_MISMATCH', message: 'Please switch to the correct network' };
    }

    setLastError(parsedError);
    return parsedError;
  }, [setLastError]);

  return {
    lastError,
    handleWeb3Error,
    clearError,
  };
}
