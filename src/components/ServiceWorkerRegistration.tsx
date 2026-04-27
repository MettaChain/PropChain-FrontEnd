"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";
import { startQueueAutoFlush } from "@/lib/offlineTransactionQueue";

/**
 * Registers the service worker, wires update notifications, and starts the
 * offline transaction-queue auto-flush listener.
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

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    const stopAutoFlush = startQueueAutoFlush();

    return () => {
      cancelled = true;
      stopAutoFlush();
    };
  }, []);

  return null;
}
