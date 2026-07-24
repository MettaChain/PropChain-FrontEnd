"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CopyToClipboardProps {
  text: string;
  onCopy?: (text: string) => void;
  children?: React.ReactNode;
  className?: string;
  showTooltip?: boolean;
  tooltipDuration?: number;
}

export function CopyToClipboard({
  text,
  onCopy,
  children,
  className,
  showTooltip = true,
  tooltipDuration = 2000,
}: CopyToClipboardProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, tooltipDuration);
    } catch (error) {
      console.error("Failed to copy:", error);
      fallbackCopy(text);
      setCopied(true);
      onCopy?.(text);

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, tooltipDuration);
    }
  }, [text, onCopy, tooltipDuration]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        {children || (
          <svg
            className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {copied ? (
              <path d="M5 13l4 4L19 7" />
            ) : (
              <>
                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </>
            )}
          </svg>
        )}
      </button>
      {showTooltip && copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded dark:bg-gray-700">
          Copied!
        </div>
      )}
    </div>
  );
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

interface CopyButtonProps {
  text: string;
  variant?: "icon" | "button";
  size?: "sm" | "md" | "lg";
  className?: string;
  onCopy?: (text: string) => void;
}

export function CopyButton({
  text,
  variant = "icon",
  size = "md",
  className,
  onCopy,
}: CopyButtonProps) {
  return (
    <CopyToClipboard
      text={text}
      onCopy={onCopy}
      className={cn(
        variant === "button" && "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md",
        variant === "button" && "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
        className
      )}
    >
      {variant === "button" ? "Copy" : null}
    </CopyToClipboard>
  );
}
