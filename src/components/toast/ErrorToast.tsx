interface ErrorToastProps {
  message: string;
  onRetry?: () => void;
  docsUrl?: string;
}

export default function ErrorToast({
  message,
  onRetry,
  docsUrl,
}: ErrorToastProps) {
  return (
    <div className="space-y-3">
      <p>{message}</p>

      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry}>
            Try Again
          </button>
        )}

        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Learn More
          </a>
        )}
      </div>
    </div>
  );
}