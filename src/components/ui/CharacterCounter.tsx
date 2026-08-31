"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CharacterCounterProps {
  maxLength?: number;
  currentLength: number;
  className?: string;
  warningThreshold?: number;
}

function CharacterCounter({
  maxLength,
  currentLength,
  className,
  warningThreshold = 0.8,
}: CharacterCounterProps) {
  if (!maxLength) return null;

  const isWarning = currentLength > maxLength * warningThreshold;
  const isExceeded = currentLength > maxLength;

  return (
    <div
      className={cn(
        "text-xs text-right",
        isExceeded && "text-destructive font-medium",
        isWarning && !isExceeded && "text-yellow-600 dark:text-yellow-400",
        !isWarning && "text-muted-foreground",
        className
      )}
      aria-live="polite"
    >
      <span>{currentLength}</span>
      <span> / </span>
      <span>{maxLength}</span>
    </div>
  );
}

interface CharacterCounterInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
  showCounter?: boolean;
  warningThreshold?: number;
}

const CharacterCounterInput = React.forwardRef<
  HTMLInputElement,
  CharacterCounterInputProps
>(
  (
    {
      maxLength,
      showCounter = true,
      warningThreshold,
      onChange,
      value,
      className,
      ...props
    },
    ref
  ) => {
    const [length, setLength] = React.useState(
      typeof value === "string" ? value.length : 0
    );

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setLength(e.target.value.length);
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          value={value}
          className={className}
          {...props}
        />
        {showCounter && (
          <CharacterCounter
            maxLength={maxLength}
            currentLength={length}
            warningThreshold={warningThreshold}
          />
        )}
      </div>
    );
  }
);

CharacterCounterInput.displayName = "CharacterCounterInput";

interface CharacterCounterTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  showCounter?: boolean;
  warningThreshold?: number;
}

const CharacterCounterTextarea = React.forwardRef<
  HTMLTextAreaElement,
  CharacterCounterTextareaProps
>(
  (
    {
      maxLength,
      showCounter = true,
      warningThreshold,
      onChange,
      value,
      className,
      ...props
    },
    ref
  ) => {
    const [length, setLength] = React.useState(
      typeof value === "string" ? value.length : 0
    );

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLength(e.target.value.length);
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <div className="space-y-1">
        <Textarea
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          value={value}
          className={className}
          {...props}
        />
        {showCounter && (
          <CharacterCounter
            maxLength={maxLength}
            currentLength={length}
            warningThreshold={warningThreshold}
          />
        )}
      </div>
    );
  }
);

CharacterCounterTextarea.displayName = "CharacterCounterTextarea";

export {
  CharacterCounter,
  CharacterCounterInput,
  CharacterCounterTextarea,
};
