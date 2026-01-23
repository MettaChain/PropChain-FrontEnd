import { useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle, CheckCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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
//   lastUpdated = new Date(),
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

//   const formatLastUpdated = (date: Date) => {
//     const now = new Date();
//     const diffMs = now.getTime() - date.getTime();
//     const diffMins = Math.floor(diffMs / 60000);

//     if (diffMins < 1) return "Just now";
//     if (diffMins < 60) return `${diffMins}m ago`;
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours}h ago`;
//     return date.toLocaleDateString();
//   };

  return (
    <div className="relative">
      {/* Refresh Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* <span>Last updated: {formatLastUpdated(lastUpdated)}</span> */}
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

      {/* Status Notifications */}
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {refreshState === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-muted rounded-full" />
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Fetching latest data...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={refreshState === "loading" ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );
};

// Skeleton components for loading states
export const MetricCardSkeleton = () => (
  <div className="glass-card rounded-xl p-6 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-8 bg-muted rounded w-32" />
        <div className="h-4 bg-muted rounded w-28" />
      </div>
      <div className="p-3 rounded-lg bg-muted w-11 h-11" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card rounded-xl p-6 animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="h-6 bg-muted rounded w-40" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-muted rounded w-12" />
          ))}
        </div>
      </div>
      <div className="h-64 bg-muted rounded" />
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="glass-card rounded-xl p-6 animate-pulse space-y-4">
    <div className="h-6 bg-muted rounded w-40" />
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-4">
        <div className="h-10 bg-muted rounded flex-1" />
        <div className="h-10 bg-muted rounded w-24" />
        <div className="h-10 bg-muted rounded w-20" />
      </div>
    ))}
  </div>
);