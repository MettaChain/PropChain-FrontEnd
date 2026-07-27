import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from '@/lib/storageKeys';

/**
 * UI-only view mode for listing screens.
 *
 * Security notes / audit:
 * - This module is UI-only and MUST NOT perform any signing or network-selection
 *   side-effects. It only persists a user-preference for view mode. Any wallet
 *   interactions should happen elsewhere.
 * - Access to `localStorage` is wrapped in try/catch to avoid exceptions in
 *   environments where storage is unavailable (e.g., private mode or SSR).
 * - Stored values are validated before use to avoid malicious or corrupted data.
 */
export type ViewMode = "grid" | "list";

const STORAGE_KEY = STORAGE_KEYS.VIEW_MODE.key;

export const isValidViewMode = (v: unknown): v is ViewMode => v === "grid" || v === "list";

/**
 * Hook to read and persist the user's preferred view mode.
 * - Safely handles SSR and localStorage errors.
 * - Ensures only `grid` | `list` values are used and persisted.
 */
export function useViewMode() {
  const [mode, setModeRaw] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidViewMode(stored)) return stored;
    } catch (err) {
      logger.warn("useViewMode: localStorage unavailable, falling back to default view mode", err);
    }

    return "grid";
  });

  // Wrap setter to validate input before persisting
  const setMode = (v: ViewMode) => {
    if (!isValidViewMode(v)) {
      logger.warn("useViewMode.setMode called with invalid mode:", v);
      return;
    }
    setModeRaw(v);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (err) {
      logger.warn("useViewMode: failed to persist mode to localStorage", err);
    }
  }, [mode]);

  return { mode, setMode } as const;
}

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * `ViewToggle` — simple UI control to switch between `grid` and `list` modes.
 *
 * Safety and validation:
 * - Buttons use `type="button"` to avoid accidentally submitting enclosing forms.
 * - `onChange` is guarded at runtime to avoid exceptions if a consumer passes
 *   a non-function value.
 * - The component does not read from or write to any wallet or network state.
 */
export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const safeChange = (v: ViewMode) => {
    if (!isValidViewMode(v)) return;
    try {
      if (typeof onChange === "function") onChange(v);
      else logger.warn("ViewToggle: onChange is not a function", onChange);
    } catch (err) {
      logger.error("ViewToggle: onChange handler threw an error", err);
    }
  };

  return (
    <div className="flex border rounded-lg overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => safeChange("grid")}
        className={`px-3 py-1.5 flex items-center gap-1 ${mode === "grid" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        aria-pressed={mode === "grid"}
        aria-label="Grid view"
      >
        <GridIcon /> <span>Grid</span>
      </button>
      <button
        type="button"
        onClick={() => safeChange("list")}
        className={`px-3 py-1.5 flex items-center gap-1 ${mode === "list" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        aria-pressed={mode === "list"}
        aria-label="List view"
      >
        <ListIcon /> <span>List</span>
      </button>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="6" height="6" rx="1" />
      <rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="0" y="1" width="14" height="2" rx="1" />
      <rect x="0" y="6" width="14" height="2" rx="1" />
      <rect x="0" y="11" width="14" height="2" rx="1" />
    </svg>
  );
}
