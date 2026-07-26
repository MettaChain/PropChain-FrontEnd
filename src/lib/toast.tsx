import { toast } from "sonner";
// or react-hot-toast depending on the project

import ErrorToast from "@/components/toast/ErrorToast";

interface ErrorToastOptions {
  message: string;
  onRetry?: () => void;
  docsUrl?: string;
}

export function showErrorToast({
  message,
  onRetry,
  docsUrl,
}: ErrorToastOptions) {
  toast.custom(() => (
    <ErrorToast
      message={message}
      onRetry={onRetry}
      docsUrl={docsUrl}
    />
  ));
}