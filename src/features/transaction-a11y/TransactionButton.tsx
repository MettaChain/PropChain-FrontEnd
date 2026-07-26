import React from 'react';
import { TransactionButtonProps } from './transactionA11yTypes';
import { useTransactionA11y } from './useTransactionA11y';

export function TransactionButton({
  onClick,
  label,
  loadingLabel = 'Processing...',
  successLabel = 'Success!',
  errorLabel = 'Failed',
  className = ''
}: TransactionButtonProps) {
  const { status, execute, liveMessage } = useTransactionA11y(onClick);

  const isPending = status === 'PENDING';
  
  let currentLabel = label;
  if (status === 'PENDING') currentLabel = loadingLabel;
  if (status === 'SUCCESS') currentLabel = successLabel;
  if (status === 'ERROR') currentLabel = errorLabel;

  return (
    <div className="relative inline-block">
      {/* Invisible live region for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        data-testid="transaction-live-region"
      >
        {liveMessage}
      </div>

      <button
        onClick={execute}
        disabled={isPending}
        aria-busy={isPending}
        className={`
          px-6 py-2 rounded-md font-medium transition-all
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${status === 'IDLE' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : ''}
          ${status === 'PENDING' ? 'bg-gray-400 text-gray-800 cursor-wait' : ''}
          ${status === 'SUCCESS' ? 'bg-green-600 text-white focus:ring-green-500' : ''}
          ${status === 'ERROR' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : ''}
          ${className}
        `}
      >
        <span className="flex items-center justify-center">
          {isPending && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {currentLabel}
        </span>
      </button>
    </div>
  );
}
