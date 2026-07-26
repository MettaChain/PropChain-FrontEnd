import { useCallback, useState } from 'react';
import { useTransactionA11yStore } from './transactionA11yStore';

export function useTransactionA11y(action: () => Promise<void>) {
  const { status, setStatus, reset } = useTransactionA11yStore();
  const [liveMessage, setLiveMessage] = useState('');

  const execute = useCallback(async () => {
    try {
      setStatus('PENDING');
      setLiveMessage('Transaction is processing. Please wait.');
      
      await action();
      
      setStatus('SUCCESS');
      setLiveMessage('Transaction completed successfully.');
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        reset();
        setLiveMessage('');
      }, 3000);
      
    } catch (error) {
      setStatus('ERROR');
      setLiveMessage('Transaction failed. Please try again.');
      
      setTimeout(() => {
        reset();
        setLiveMessage('');
      }, 5000);
    }
  }, [action, setStatus, reset]);

  return {
    status,
    execute,
    liveMessage
  };
}
