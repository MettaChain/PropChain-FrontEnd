"use client";

import { useState, type ReactNode } from "react";

export interface CognitiveTransactionStep {
  id: string;
  title: string;
  description: string;
  /** Optional details stay hidden until the user asks to see advanced options. */
  advancedDetails?: ReactNode;
  /** Run when the user completes this step. */
  onContinue?: () => void | Promise<void>;
  /** Provide this only when the completed step can safely be reversed. */
  onUndo?: () => void | Promise<void>;
}

export interface CognitiveTransactionFlowProps {
  title: string;
  description: string;
  steps: CognitiveTransactionStep[];
  summary: Array<{ label: string; value: string }>;
  estimatedCost: string;
  estimatedTime: string;
  finalActionLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function CognitiveTransactionFlow({
  title,
  description,
  steps,
  summary,
  estimatedCost,
  estimatedTime,
  finalActionLabel = "Confirm transaction",
  onConfirm,
  onCancel,
}: CognitiveTransactionFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSummary, setShowSummary] = useState(steps.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = steps[stepIndex];
  const progress = steps.length === 0 || showSummary
    ? 100
    : Math.round((completedSteps.length / steps.length) * 100);

  const continueStep = async () => {
    if (!currentStep) {
      setShowSummary(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await currentStep.onContinue?.();
      setCompletedSteps((done) => [...done.filter((id) => id !== currentStep.id), currentStep.id]);
      setShowAdvanced(false);
      if (stepIndex === steps.length - 1) setShowSummary(true);
      else setStepIndex((index) => index + 1);
    } catch {
      setError("This step could not be completed. Check your connection or details, then try again.");
    } finally {
      setBusy(false);
    }
  };

  const undoPreviousStep = async () => {
    const previousStep = steps[stepIndex - 1];
    if (!previousStep?.onUndo) return;
    setBusy(true);
    setError(null);
    try {
      await previousStep.onUndo();
      setCompletedSteps((done) => done.filter((id) => id !== previousStep.id));
      setStepIndex((index) => index - 1);
    } catch {
      setError("We could not undo that change. Your current settings are unchanged; try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError("The transaction was not completed. Your review is saved here; check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="transaction-flow-title" className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-6">
      <header>
        <h2 id="transaction-flow-title" className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </header>

      <dl aria-label="Estimated transaction cost and time" className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <div><dt className="text-xs text-slate-500 dark:text-slate-400">Estimated cost</dt><dd className="mt-1 font-semibold">{estimatedCost}</dd></div>
        <div><dt className="text-xs text-slate-500 dark:text-slate-400">Estimated time</dt><dd className="mt-1 font-semibold">{estimatedTime}</dd></div>
      </dl>

      <div className="mt-5" aria-label="Transaction progress">
        <div className="mb-2 flex justify-between text-sm">
          <span>{showSummary ? "Ready for your review" : `Step ${Math.min(stepIndex + 1, Math.max(steps.length, 1))} of ${steps.length}`}</span>
          <span>{progress}%</span>
        </div>
        <div role="progressbar" aria-label="Transaction progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {!showSummary && currentStep && (
        <div className="mt-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{currentStep.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{currentStep.description}</p>
          {currentStep.advancedDetails && (
            <div className="mt-4">
              <button type="button" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((shown) => !shown)} className="min-h-11 rounded-md text-sm font-medium text-blue-700 underline underline-offset-2 dark:text-blue-300">
                {showAdvanced ? "Hide advanced options" : "Show advanced options"}
              </button>
              {showAdvanced && <div className="mt-2 rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-700">{currentStep.advancedDetails}</div>}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {stepIndex > 0 && steps[stepIndex - 1]?.onUndo && (
              <button type="button" onClick={undoPreviousStep} disabled={busy} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">Undo previous change</button>
            )}
            <button type="button" onClick={continueStep} disabled={busy} className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {busy ? "Please wait..." : stepIndex === steps.length - 1 ? "Review transaction" : "Continue"}
            </button>
            {onCancel && <button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>}
          </div>
        </div>
      )}

      {showSummary && (
        <div className="mt-6" aria-live="polite">
          <h3 className="text-lg font-semibold">Review before you confirm</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Check these details. The transaction will only be sent after you confirm.</p>
          <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 px-4 dark:divide-slate-700 dark:border-slate-700">
            {summary.map((item) => <div key={item.label} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt className="text-slate-500 dark:text-slate-400">{item.label}</dt><dd className="font-medium">{item.value}</dd></div>)}
            <div className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt className="text-slate-500 dark:text-slate-400">Estimated cost</dt><dd className="font-medium">{estimatedCost}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={confirm} disabled={busy} className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? "Sending..." : finalActionLabel}</button>
            <button type="button" onClick={() => { setShowSummary(false); setStepIndex(Math.max(steps.length - 1, 0)); }} disabled={busy} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">Back to review steps</button>
          </div>
        </div>
      )}

      {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">{error}</div>}
    </section>
  );
}

export default CognitiveTransactionFlow;
