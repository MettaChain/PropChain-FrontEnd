import { useState, useEffect } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "propchain:listing-view";

export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem(STORAGE_KEY) as ViewMode) ?? "grid";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return { mode, setMode };
}

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex border rounded-lg overflow-hidden text-sm">
      <button
        onClick={() => onChange("grid")}
        className={`px-3 py-1.5 flex items-center gap-1 ${mode === "grid" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        aria-pressed={mode === "grid"}
      >
        <GridIcon /> Grid
      </button>
      <button
        onClick={() => onChange("list")}
        className={`px-3 py-1.5 flex items-center gap-1 ${mode === "list" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        aria-pressed={mode === "list"}
      >
        <ListIcon /> List
      </button>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="6" height="6" rx="1" />
      <rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="1" width="14" height="2" rx="1" />
      <rect x="0" y="6" width="14" height="2" rx="1" />
      <rect x="0" y="11" width="14" height="2" rx="1" />
    </svg>
  );
}
