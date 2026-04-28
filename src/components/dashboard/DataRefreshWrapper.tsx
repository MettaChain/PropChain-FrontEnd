import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DataRefreshWrapperProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  lastUpdated?: Date;
  autoRefreshInterval?: number;
}

type RefreshState = "idle" | "loading" | "success" | "error";

export const DataRefreshWrapper = ({
  children,
  onRefresh,
  autoRefreshInterval,
}: DataRefreshWrapperProps) => {
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshState("loading");
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 90% success rate for demo
          if (Math.random() > 0.1) {
            resolve(true);
          } else {
            reject(new Error("Failed to fetch latest data"));
          }
        }, 1500);
      });

      if (onRefresh) {
        await onRefresh();
      }

      setRefreshState("success");
      setTimeout(() => setRefreshState("idle"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setRefreshState("error");
    }
  }, [onRefresh]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {autoRefreshInterval && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              Auto-refresh: {autoRefreshInterval / 1000}s
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshState === "loading"}
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshState === "loading" ? "animate-spin" : ""}`}
          />
          {refreshState === "loading" ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <AnimatePresence>
        {refreshState === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-success text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Data refreshed successfully
          </motion.div>
        )}

        {refreshState === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-2 h-6 px-2 text-xs"
            >
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {refreshState === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <div className="w-full px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-xl p-6 border border-border/50 bg-white/60 dark:bg-gray-900/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-11 w-11 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={refreshState === "loading" ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );
};

export const MetricCardSkeleton = () => (
  <div className="glass-card rounded-xl p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-11 w-11 rounded-lg" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card rounded-xl p-6">
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="glass-card rounded-xl p-6 space-y-4">
    <Skeleton className="h-6 w-40" />
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    ))}
  </div>
);