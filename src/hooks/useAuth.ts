"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/store/walletStore";

const WARN_BEFORE_MS = 5 * 60 * 1000;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userAddress: string | null;
  sessionExpiresAt: number | null;
}

/**
 * Wallet-derived authentication state.
 *
 * Treats a connected wallet with an address as authenticated, and only after
 * hydration so server and client markup agree on the first paint.
 */
export function useAuth() {
  const { address, isConnected } = useWalletStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const hasVerifiedWallet = isHydrated && isConnected && Boolean(address);

  return {
    isAuthenticated: hasVerifiedWallet,
    isLoading: !isHydrated,
    userAddress: hasVerifiedWallet ? address : null,
    sessionExpiresAt: null,
    WARN_BEFORE_MS,
  } satisfies AuthState & { WARN_BEFORE_MS: number };
}
