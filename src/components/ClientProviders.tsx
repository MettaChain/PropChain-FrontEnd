"use client";

import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { ChainAwareProvider } from "@/providers/ChainAwareProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { LoadingProgressBar } from "@/components/LoadingProgressBar";
import "@/lib/i18n";
import dynamic from "next/dynamic";

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
const FloatingComparisonBar = dynamic(
  () => import("@/components/FloatingComparisonBar").then((m) => m.FloatingComparisonBar),
  { ssr: false }
);
const MobileBottomNavigation = dynamic(
  () => import("@/components/MobileBottomNavigation").then((m) => m.MobileBottomNavigation),
  { ssr: false }
);

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <ChainAwareProvider>
        <LoadingProgressBar />
        <PerformanceMonitor />
        {children}
        <TransactionMonitor />
        <NotificationSystem />
        <Toaster />
        <FloatingComparisonBar />
        <MobileBottomNavigation />
      </ChainAwareProvider>
      <QueryProvider>
        <ChainAwareProvider>
          <LoadingProgressBar />
          <PerformanceMonitor />
          <ServiceWorkerRegistration />
          <OfflineIndicator />
          {children}
          <TransactionMonitor />
          <NotificationSystem />
          <Toaster />
          <MobileBottomNavigation />
        </ChainAwareProvider>
      </QueryProvider>
    </WagmiProvider>
  );
}
