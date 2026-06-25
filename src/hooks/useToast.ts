"use client";

import { toast } from "sonner";

export type ToastOptions = {
  description?: string;
  duration?: number;
  id?: string | number;
};

export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) =>
      toast.success(message, options),

    error: (message: string, options?: ToastOptions) =>
      toast.error(message, options),

    warning: (message: string, options?: ToastOptions) =>
      toast.warning(message, options),

    info: (message: string, options?: ToastOptions) =>
      toast.info(message, options),

    dismiss: (id?: string | number) => toast.dismiss(id),
  };
}
