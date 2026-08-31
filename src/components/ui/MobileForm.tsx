"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface MobileFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  as?: "input" | "textarea";
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const MobileFormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  MobileFormFieldProps
>(
  (
    {
      label,
      error,
      helperText,
      required,
      className,
      id,
      as = "input",
      textareaProps,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>

        {as === "textarea" ? (
          <Textarea
            id={fieldId}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={cn(
              "min-h-[120px] text-base md:text-sm",
              "touch-manipulation",
              error && "border-destructive focus-visible:ring-destructive/20",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...textareaProps}
          />
        ) : (
          <Input
            id={fieldId}
            ref={ref as React.Ref<HTMLInputElement>}
            className={cn(
              "h-12 md:h-9 text-base md:text-sm",
              "touch-manipulation",
              error && "border-destructive focus-visible:ring-destructive/20",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
        )}

        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MobileFormField.displayName = "MobileFormField";

export interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

function MobileForm({ children, onSubmit, className }: MobileFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "space-y-6",
        "max-w-full",
        className
      )}
    >
      {children}
    </form>
  );
}

export interface MobileFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

function MobileFormActions({ children, className }: MobileFormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row gap-3",
        "pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export { MobileFormField, MobileForm, MobileFormActions };
