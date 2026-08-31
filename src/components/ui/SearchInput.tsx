"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  showClearButton?: boolean;
  loading?: boolean;
  className?: string;
  inputClassName?: string;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  showClearButton = true,
  loading = false,
  className,
  inputClassName,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? "");
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, debounceMs);
    },
    [onChange, onSearch, debounceMs]
  );

  const handleClear = React.useCallback(() => {
    setInternalValue("");
    onChange?.("");
    onSearch?.("");
  }, [onChange, onSearch]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        onSearch?.(value);
      }
    },
    [onSearch, value]
  );

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {loading ? (
          <svg
            className="h-5 w-5 animate-spin text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900",
          "placeholder:text-gray-400",
          "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          "dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400",
          "dark:focus:border-blue-400 dark:focus:ring-blue-400",
          inputClassName
        )}
        {...props}
      />
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
