"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, Clock3, RotateCcw } from "lucide-react";

export interface TransactionStep {
  title: string;
  description: string;
}

export interface TransactionFlowGuideProps {
  steps: TransactionStep[];
  currentStep: number;
  estimatedTime: string;
  estimatedCost: string;
  summary: Record<string, string>;
  advancedOptionsLabel?: string;
  advancedOptions?: React.ReactNode;
  error?: string;
  canUndo?: boolean;
  onUndo?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  dark?: boolean;
}

export default function TransactionFlowGuide({
  steps,
  currentStep,
  estimatedTime,
  estimatedCost,
  summary,
  advancedOptionsLabel = "Advanced options",
  advancedOptions,
  error,
  canUndo = false,
  onUndo,
  onPrimaryAction,
  primaryActionLabel = "Confirm transaction",
  dark = false,
}: TransactionFlowGuideProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const safeStep = Math.max(0, Math.min(currentStep, steps.length - 1));
  const surface = dark
    ? "border-slate-700 bg-slate-950 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";

  return (
    <section aria-label="Transaction flow" className={`w-full rounded-xl border p-5 ${surface}`}>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Step {safeStep + 1} of {steps.length}</span>
          <span aria-live="polite">{steps[safeStep].title}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Transaction progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={safeStep + 1}
          className="h-2 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-[width]"
            style={{ width: `${((safeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="mb-5 grid gap-2 sm:grid-cols-4" aria-label="Transaction steps">
        {steps.map((step, index) => (
          <li
            key={step.title}
            aria-current={index === safeStep ? "step" : undefined}
            className={`rounded-lg border p-3 ${index === safeStep ? "border-blue-500 bg-blue-50 text-blue-950" : index < safeStep ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}
          >
            <span className="block text-xs font-semibold">{index + 1}. {step.title}</span>
            <span className="mt-1 block text-xs opacity-80">{step.description}</span>
          </li>
        ))}
      </ol>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4" aria-hidden />Estimated time</p>
          <p className="mt-1 text-sm">{estimatedTime}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-medium">Estimated cost</p>
          <p className="mt-1 text-sm">{estimatedCost}</p>
        </div>
      </div>

      {advancedOptions && (
        <div className="mb-5">
          <button
            type="button"
            aria-expanded={advancedOpen}
            aria-controls="transaction-advanced-options"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-left text-sm font-medium"
          >
            {advancedOptionsLabel}
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {advancedOpen && (
            <div id="transaction-advanced-options" className="mt-2 rounded-lg border p-3">
              {advancedOptions}
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span><strong>Action needed:</strong> {error}</span>
          </p>
        </div>
      )}

      <div className="mb-5 rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold">Review summary</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(summary).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-slate-200 pb-2">
              <dt className="text-slate-600">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {canUndo && onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Undo last action
          </button>
        )}
        {onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {primaryActionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
