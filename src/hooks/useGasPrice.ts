'use client';

import { useEffect } from "react";
import { useGasPriceStore } from "@/store/gasPriceStore";
import { useTransactionStore } from "@/store/transactionStore";
import { logger } from "@/utils/logger";

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const GAS_PRICE_API = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY ?? ""}`;
const POLL_INTERVAL_MS = 15_000;

const isDocumentVisible = (): boolean =>
  typeof document === "undefined"
    ? false
    : document.visibilityState === "visible";

/**
 * Issue #1064 — Gas price polling used to fire from the root layout for every
 * visitor on every route every 15s, hammering Etherscan even when nothing is
 * being signed. Polling is now:
 *   - paused whenever the tab is hidden (visibilitychange), and
 *   - only kept on a steady 15s cadence while an actual transaction is
 *     pending in the transaction store (i.e. "tx UI active").
 * A single warm-up fetch per page view keeps the banner's estimate fresh for
 * browsing-only sessions without the continuous background polling load.
 */
export const useGasPrice = () => {
  const { setGasPrice } = useGasPriceStore();
  const pendingTransactionCount = useTransactionStore(
    (state) => state.pendingTransactions.length,
  );

  useEffect(() => {
    if (!ETHERSCAN_API_KEY) {
      logger.warn(
        "NEXT_PUBLIC_ETHERSCAN_API_KEY is not set; skipping gas price polling",
      );
      return;
    }

    const fetchGasPrice = async () => {
      if (!isDocumentVisible()) return;

      try {
        const response = await fetch(GAS_PRICE_API);
        const data = await response.json();
        const price = parseInt(data.result.ProposeGasPrice, 10);
        if (Number.isFinite(price)) {
          setGasPrice(price);
        } else {
          logger.warn(
            "Gas price API returned a non-numeric value; keeping previous estimate",
          );
        }
      } catch (error) {
        logger.warn("Failed to fetch gas price, keeping previous estimate", {
          error,
        });
      }
    };

    // One warm-up fetch per page view so the banner has a recent value even
    // before the first transaction begins.
    void fetchGasPrice();

    const shouldKeepPolling = (): boolean =>
      isDocumentVisible() && pendingTransactionCount > 0;

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval !== null || !shouldKeepPolling()) return;
      interval = setInterval(fetchGasPrice, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Refresh immediately when the tab becomes visible again, then resume the
    // cadence only if a transaction is still in flight.
    const onVisibilityChange = () => {
      if (isDocumentVisible()) {
        void fetchGasPrice();
      }
      shouldKeepPolling() ? startPolling() : stopPolling();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);
    window.addEventListener("blur", stopPolling);

    startPolling();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
      window.removeEventListener("blur", stopPolling);
      stopPolling();
    };
  }, [setGasPrice, pendingTransactionCount]);
};