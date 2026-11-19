'use client';

import * as React from 'react';
import { create } from 'zustand';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  /** ms; 0 disables auto-dismiss */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

const MAX_TOASTS = 5;

interface ToastQueue {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

export const useToastQueue = create<ToastQueue>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-MAX_TOASTS) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const styles: Record<ToastVariant, { box: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { box: 'border-green-500 bg-green-50 text-green-900', Icon: CheckCircle },
  error: { box: 'border-red-500 bg-red-50 text-red-900', Icon: AlertCircle },
  warning: { box: 'border-yellow-500 bg-yellow-50 text-yellow-900', Icon: AlertTriangle },
  info: { box: 'border-blue-500 bg-blue-50 text-blue-900', Icon: Info },
};

function ToastView({ toast }: { toast: ToastItem }) {
  const dismiss = useToastQueue((s) => s.dismiss);
  const { box, Icon } = styles[toast.variant];
  const duration = toast.duration ?? 5000;

  React.useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => dismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss, toast.id]);

  return (
    <div
      role="alert"
      className={`ui-toast-in flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg ${box}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className="text-sm font-medium underline"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" aria-label="Close notification" onClick={() => dismiss(toast.id)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastVariants() {
  const toasts = useToastQueue((s) => s.toasts);
  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      <style>{`
        @keyframes ui-toast-in { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }
        .ui-toast-in { animation: ui-toast-in 0.25s ease-out; }
        @media (prefers-reduced-motion: reduce) { .ui-toast-in { animation: none; } }
      `}</style>
      {toasts.map((t) => (
        <ToastView key={t.id} toast={t} />
      ))}
    </div>
  );
}

export default ToastVariants;
