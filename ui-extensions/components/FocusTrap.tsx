'use client';

import React, { useId, type ReactNode } from 'react';

import { useFocusTrap } from '../hooks/useFocusTrap';

export interface FocusTrapProps {
  /** Render and trap while true. */
  active?: boolean;
  children: ReactNode;
  /** Focused when the trap activates. Defaults to the first focusable child. */
  initialFocus?: HTMLElement | null;
  /** Restore focus to the trigger on close. Defaults to `true`. */
  restoreFocus?: boolean;
  /** Called on Escape while this trap is the topmost one. */
  onEscape?: () => void;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * Wrapper that confines keyboard focus to its children (#1367).
 *
 * The `role="dialog"` + `aria-modal` pairing is what screen readers need to
 * suppress the rest of the page; the actual trapping is delegated to
 * `useFocusTrap` so plain `<dialog>`-less markup gets the same behaviour.
 */
export function FocusTrap({
  active = true,
  children,
  initialFocus,
  restoreFocus = true,
  onEscape,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: FocusTrapProps) {
  const { ref } = useFocusTrap<HTMLDivElement>({
    active,
    initialFocus,
    restoreFocus,
    onEscape,
  });
  const fallbackId = useId();
  // Only render the fallback label text when the caller supplied neither an
  // `aria-label` nor a foreign `aria-labelledby` element, which would otherwise
  // be duplicated by the generated id.
  const needsFallbackLabel = !ariaLabel && !ariaLabelledBy;

  if (!active) return <>{children}</>;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (needsFallbackLabel ? fallbackId : undefined)}
      className={className}
    >
      {needsFallbackLabel ? (
        <span id={fallbackId} className="sr-only">
          Dialog
        </span>
      ) : null}
      {children}
    </div>
  );
}

export default FocusTrap;
