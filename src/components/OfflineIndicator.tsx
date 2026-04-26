"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  getQueuedTransactions,
  subscribeToQueue,
  type QueuedTransaction,
} from "@/lib/offlineTransactionQueue";

const RECONNECTED_DURATION_MS = 4000;

/**
 * Persistent banner shown across the app.
 *
 *  - When offline: a red banner with the queued-transaction count.
 *  - When the connection returns and there were queued transactions: a brief
 *    success banner that auto-dismisses.
 */
export function OfflineIndicator(): React.ReactElement | null {
  const isOnline = useOnlineStatus();
  const [queueLength, setQueueLength] = useState(0);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    getQueuedTransactions().then((items: QueuedTransaction[]) => {
      if (mounted) setQueueLength(items.length);
    });
    const unsubscribe = subscribeToQueue((queue) => {
      if (mounted) setQueueLength(queue.length);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
      return undefined;
    }
    if (wasOffline) {
      setShowReconnected(true);
      const timeout = window.setTimeout(
        () => setShowReconnected(false),
        RECONNECTED_DURATION_MS
      );
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="offline-banner"
        className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md"
      >
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span>
          You&apos;re offline — showing cached content.
          {queueLength > 0 && (
            <span className="ml-1 opacity-90">
              {queueLength} pending transaction{queueLength === 1 ? "" : "s"}{" "}
              will retry when you&apos;re back online.
            </span>
          )}
        </span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="online-banner"
        className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        <span>Back online — syncing pending updates.</span>
      </div>
    );
  }

  return null;
}
