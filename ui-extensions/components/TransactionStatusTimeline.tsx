"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, RotateCw, XCircle } from "lucide-react";

export type TimelineStatus = "complete" | "current" | "pending" | "failed";

export interface TimelineStage {
  id: string;
  label: string;
  status: TimelineStatus;
  /** ISO timestamp or Date; omitted for stages not yet reached. */
  timestamp?: string | Date;
  details?: string;
  /** Shown when status is "failed". */
  error?: string;
}

interface Props {
  stages: TimelineStage[];
  onRetry?: (stageId: string) => void;
}

const ICONS = {
  complete: <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />,
  current: <Clock className="h-5 w-5 text-blue-600" aria-hidden />,
  pending: <Circle className="h-5 w-5 text-gray-400" aria-hidden />,
  failed: <XCircle className="h-5 w-5 text-red-600" aria-hidden />,
} as const;

export default function TransactionStatusTimeline({ stages, onRetry }: Props) {
  return (
    <ol aria-label="Transaction status timeline" className="space-y-4">
      {stages.map((stage) => (
        <li
          key={stage.id}
          aria-label={`${stage.label}: ${stage.status}`}
          aria-current={stage.status === "current" ? "step" : undefined}
          className="flex gap-3"
        >
          <motion.span
            key={stage.status}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-0.5"
          >
            {ICONS[stage.status]}
          </motion.span>
          <div className="flex-1">
            <p className="font-medium">
              {stage.label}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({stage.status})
              </span>
            </p>
            {stage.timestamp && (
              <time
                className="text-xs text-gray-500"
                dateTime={new Date(stage.timestamp).toISOString()}
              >
                {new Date(stage.timestamp).toLocaleString()}
              </time>
            )}
            {stage.details && (
              <p className="text-sm text-gray-600">{stage.details}</p>
            )}
            <AnimatePresence>
              {stage.status === "failed" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="mt-1 text-sm text-red-600"
                >
                  <p>{stage.error ?? "This step failed."}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(stage.id)}
                      className="mt-1 inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs hover:bg-red-50"
                    >
                      <RotateCw className="h-3 w-3" aria-hidden />
                      Retry
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </li>
      ))}
    </ol>
  );
}
