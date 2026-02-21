"use client";

import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { ChainAwareProvider } from "@/providers/ChainAwareProvider";
import { TransactionMonitor } from "@/components/TransactionMonitor";
import { NotificationSystem } from "@/components/NotificationSystem";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/i18n";
import dynamic from "next/dynamic";
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import { ChainAwareProvider } from '@/providers/ChainAwareProvider';
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

interface ClientProvidersProps {
  children: React.ReactNode;
}

const TransactionMonitor = dynamic(
  () => import("@/components/TransactionMonitor").then((m) => m.TransactionMonitor),
  { ssr: false }
);
const NotificationSystem = dynamic(
  () => import("@/components/NotificationSystem").then((m) => m.NotificationSystem),
  { ssr: false }
);
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false }
);

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <ChainAwareProvider>
        <PerformanceMonitor />
        {children}
        <TransactionMonitor />
        <NotificationSystem />
        <Toaster />
      </ChainAwareProvider>
    </WagmiProvider>
  );
}
