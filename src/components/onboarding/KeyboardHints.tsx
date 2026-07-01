import React from "react";

interface KeyboardHintsProps {
  className?: string;
}

export default function KeyboardHints({
  className = "",
}: KeyboardHintsProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-xs text-gray-500 ${className}`}
      aria-label="Keyboard navigation shortcuts"
    >
      <span className="flex items-center gap-1">
        <kbd className="rounded border px-1 py-0.5 font-mono">←</kbd>
        <span>Previous</span>
      </span>

      <span className="flex items-center gap-1">
        <kbd className="rounded border px-1 py-0.5 font-mono">→</kbd>
        <span>Next</span>
      </span>

      <span className="flex items-center gap-1">
        <kbd className="rounded border px-1 py-0.5 font-mono">Esc</kbd>
        <span>Close Tour</span>
      </span>
    </div>
  );
}