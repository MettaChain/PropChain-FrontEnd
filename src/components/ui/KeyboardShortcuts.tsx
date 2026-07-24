"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
}

interface KeyboardShortcutsOptions {
  shortcuts: Shortcut[];
  enabled?: boolean;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  ignoreInputs = true,
}: KeyboardShortcutsOptions) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (ignoreInputs && isInputFocused()) return;

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const metaMatch = shortcut.meta ? e.metaKey : true;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled, ignoreInputs]);
}

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    activeElement.getAttribute("contenteditable") === "true"
  );
}

interface ShortcutHintProps {
  shortcut: {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  className?: string;
}

export function ShortcutHint({ shortcut, className }: ShortcutHintProps) {
  const keys: string[] = [];

  if (shortcut.ctrl) keys.push("Ctrl");
  if (shortcut.alt) keys.push("Alt");
  if (shortcut.shift) keys.push("Shift");
  if (shortcut.meta) keys.push("⌘");
  keys.push(shortcut.key.toUpperCase());

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 font-mono text-[10px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}

interface ShortcutsDialogProps {
  shortcuts: Array<{
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    description: string;
  }>;
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ shortcuts, open, onClose }: ShortcutsDialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <ShortcutHint shortcut={shortcut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { type Shortcut as KeyboardShortcut };
