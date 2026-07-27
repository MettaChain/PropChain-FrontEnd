"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, required, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} required={required}>
        <Input
          ref={ref}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
      </FormField>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, error, required, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} required={required}>
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
      </FormField>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  loading?: boolean;
  submitLabel?: string;
  loadingLabel?: string;
}

export function Form({
  children,
  loading = false,
  submitLabel = "Submit",
  loadingLabel = "Processing...",
  className,
  ...props
}: FormProps) {
  return (
    <form className={cn("space-y-4", className)} {...props}>
      {children}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, (value: unknown) => string | undefined>>
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const validate = React.useCallback(
    (name: keyof T, value: unknown): string | undefined => {
      const rule = validationRules[name];
      if (rule) {
        return rule(value);
      }
      return undefined;
    },
    [validationRules]
  );

  const handleChange = React.useCallback(
    (name: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validate(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validate]
  );

  const handleBlur = React.useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validate(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [values, validate]
  );

  const handleSubmit = React.useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => {
      return async (e: React.FormEvent) => {
        e.preventDefault();
        
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<keyof T, boolean>
        );
        setTouched(allTouched);

        const allErrors = Object.keys(values).reduce(
          (acc, key) => {
            const error = validate(key as keyof T, values[key as keyof T]);
            return { ...acc, [key]: error };
          },
          {} as Partial<Record<keyof T, string>>
        );
        setErrors(allErrors);

        const hasErrors = Object.values(allErrors).some((error) => error);
        if (!hasErrors) {
          await onSubmit(values);
        }
      };
    },
    [values, validate]
  );

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    isValid: Object.values(errors).every((error) => !error),
  };
}
