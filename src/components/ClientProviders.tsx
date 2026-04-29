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

import { useOnboardingStore } from "@/store/onboardingStore";
import { DomainWarningBanner } from "@/components/DomainWarningBanner";
import { useEffect } from "react";

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
const OnboardingTour = dynamic(
  () => import("@/components/OnboardingTour").then((m) => m.OnboardingTour),
  { ssr: false }
);

export function ClientProviders({ children }: ClientProvidersProps) {
  const { startOnboarding, hasCompletedOnboarding } = useOnboardingStore();

  useEffect(() => {
    // Automatically start onboarding for new users after a short delay
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        startOnboarding();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding, startOnboarding]);

  return (
    <WagmiProvider config={config}>
      <QueryProvider>
        <ChainAwareProvider>
          <LoadingProgressBar />
          <PerformanceMonitor />
          <ServiceWorkerRegistration />
          <OfflineIndicator />
          <DomainWarningBanner />
          {children}
          <TransactionMonitor />
          <NotificationSystem />
          <Toaster />
          <FloatingComparisonBar />
          <MobileBottomNavigation />
          <OnboardingTour />
        </ChainAwareProvider>
      </QueryProvider>
    </WagmiProvider>
  );
}
