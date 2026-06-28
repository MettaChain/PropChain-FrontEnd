"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";
import { startQueueAutoFlush } from "@/lib/offlineTransactionQueue";

/**
 * Schedules a callback during browser idle time, falling back to setTimeout.
 */
function scheduleWhenIdle(callback: () => void): () => void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(callback, { timeout: 5000 });
    return () => window.cancelIdleCallback(handle);
  }

  const timeout = window.setTimeout(callback, 2000);
  return () => window.clearTimeout(timeout);
}

/**
 * Registers the service worker, wires update notifications, and starts the
 * offline transaction-queue auto-flush listener.
 *
 * Registration is deferred via requestIdleCallback (with a 5 s timeout)
 * to avoid blocking the initial paint and keep Time to Interactive low.
 * The auto-flush listener is still started eagerly since it is cheap.
 */
export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "test") return;

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (error) {
        logger.warn("Service worker registration failed", error);
      }
    };

    const cancelIdle = scheduleWhenIdle(register);

    const stopAutoFlush = startQueueAutoFlush();

    return () => {
      cancelled = true;
      cancelIdle();
      stopAutoFlush();
    };
  }, []);

  return null;
}
