"use client";

export type KYCStatus = "in-progress" | "error" | "completed";

export interface KYCVerificationStepperProps {
  currentStep: 1 | 2 | 3 | 4;
  status?: KYCStatus;
  errorMessage?: string;
  onStepChange?: (step: 1 | 2 | 3 | 4) => void;
  dark?: boolean;
}

const steps = [
  { number: 1, label: "Personal information", detail: "Enter your legal details" },
  { number: 2, label: "Document upload", detail: "Verify your identity document" },
  { number: 3, label: "Selfie verification", detail: "Confirm it is really you" },
  { number: 4, label: "Review", detail: "Submit your verification" },
] as const;

export function KYCVerificationStepper({
  currentStep,
  status = "in-progress",
  errorMessage = "We couldn't verify these details. Please review and try again.",
  onStepChange,
  dark = false,
}: KYCVerificationStepperProps) {
  const completed = status === "completed" ? 4 : currentStep - 1;
  const surface = dark ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900";

  return (
    <section aria-label="KYC verification progress" className={`w-full rounded-xl border p-5 shadow-sm ${surface}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Identity verification</h3>
          <p className="text-sm text-slate-500">{status === "completed" ? "Verification complete" : `Step ${currentStep} of 4`}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "error" ? "bg-rose-100 text-rose-800" : status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
          {status === "in-progress" ? "In progress" : status === "error" ? "Action required" : "Completed"}
        </span>
      </div>
      <ol className="space-y-4">
        {steps.map((step) => {
          const isDone = step.number <= completed;
          const isCurrent = status !== "completed" && step.number === currentStep;
          return (
            <li key={step.number} className="flex items-start gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isDone ? "bg-emerald-600 text-white" : isCurrent && status === "error" ? "bg-rose-100 text-rose-800" : isCurrent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {isDone ? "✓" : step.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{step.label}</p>
                <p className="text-sm text-slate-500">{step.detail}</p>
              </div>
              {onStepChange && (
                <button type="button" onClick={() => onStepChange(step.number)} className="text-xs font-medium text-blue-600 hover:underline">
                  {isCurrent ? "Current" : "View"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {status === "error" && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</p>}
      {status === "completed" && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Your identity has been successfully verified.</p>}
    </section>
  );
}

export default KYCVerificationStepper;
