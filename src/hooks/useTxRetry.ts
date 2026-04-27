import { useState, useCallback } from "react";

const MAX_RETRIES = 3;
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "TIMEOUT", "UNPREDICTABLE_GAS_LIMIT"]);

type TxStatus = "idle" | "pending" | "success" | "failed";

interface UseTxRetryOptions {
  onSuccess?: (hash: string) => void;
  onFailure?: (error: Error) => void;
}

export function useTxRetry(
  sendTx: (gasMultiplier: number) => Promise<string>,
  options: UseTxRetryOptions = {}
) {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const execute = useCallback(
    async (retryCount = 0) => {
      setStatus("pending");
      setError(null);
      const gasMultiplier = 1 + retryCount * 0.2; // bump gas 20% per retry

      try {
        const hash = await sendTx(gasMultiplier);
        setStatus("success");
        setAttempts(0);
        options.onSuccess?.(hash);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        const isRetryable = e.code ? RETRYABLE_CODES.has(e.code) : true;
        const nextAttempt = retryCount + 1;

        if (isRetryable && nextAttempt < MAX_RETRIES) {
          setAttempts(nextAttempt);
          setStatus("failed");
          setError(`Transaction failed: ${e.message ?? "unknown error"}. Retry ${nextAttempt}/${MAX_RETRIES} available.`);
        } else {
          setStatus("failed");
          setAttempts(0);
          const finalError = new Error(e.message ?? "Transaction failed");
          setError(isRetryable ? "Max retries reached." : `Non-retryable error: ${e.message}`);
          options.onFailure?.(finalError);
        }
      }
    },
    [sendTx, options]
  );

  const retry = useCallback(() => execute(attempts), [execute, attempts]);
  const canRetry = status === "failed" && attempts > 0 && attempts < MAX_RETRIES;

  return { status, error, canRetry, attempts, execute: () => execute(0), retry };
}
