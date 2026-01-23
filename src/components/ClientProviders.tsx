'use client';

import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import { ChainAwareProvider } from '@/providers/ChainAwareProvider';
import { TransactionMonitor } from '@/components/TransactionMonitor';
import { NotificationSystem } from '@/components/NotificationSystem';
import { Toaster } from '@/components/ui/sonner';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <ChainAwareProvider>
        {children}
        <TransactionMonitor />
        <NotificationSystem />
        <Toaster />
      </ChainAwareProvider>
    </WagmiProvider>
  );
}