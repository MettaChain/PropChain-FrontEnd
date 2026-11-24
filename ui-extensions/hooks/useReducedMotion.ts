import { useEffect, useState } from "react";

/**
 * `prefers-reduced-motion` support for extension animations (#1371).
 *
 * Mirrors the `matchMedia` subscription style of `src/hooks/use-mobile.ts` and
 * adds a class-based escape hatch so animations can also be disabled per
 * provider regardless of the OS setting.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Class that neutralises animation and transition durations (see styles/reduced-motion.css). */
export const REDUCED_MOTION_CLASS = "motion-reduced";

export interface MotionPreference {
  /** True when the user asked for less motion. */
  reduced: boolean;
}

function queryReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Impure read of the current media-query state. Safe on the server, where it
 * returns `false` so the first paint is never animation-free by accident.
 */
export function prefersReducedMotion(): boolean {
  return queryReducedMotion();
}

/**
 * Boolean motion preference that re-renders when the OS setting changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => queryReducedMotion());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(mql.matches);
    // `addEventListener` is the modern API; older Safari only has the
    // deprecated `addListener`, so fall back when it is missing.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return reduced;
}

/**
 * Returns `REDUCED_MOTION_CLASS` when motion is reduced, otherwise an empty
 * string, so it can be merged into any `className`.
 */
export function reducedMotionClass(reduced: boolean): string {
  return reduced ? REDUCED_MOTION_CLASS : "";
}

/** Merges `className` with the reduced-motion class for the current preference. */
export function useReducedMotionClass(className = ""): string {
  const reduced = useReducedMotion();
  return [className, reducedMotionClass(reduced)].filter(Boolean).join(" ");
}

/**
 * Animation/transition duration to use for `motionMs` given the preference.
 * When motion is reduced the duration collapses to `0` so frames are skipped
 * rather than merely shortened.
 */
export function motionDuration(reduced: boolean, motionMs: number): number {
  return reduced ? 0 : motionMs;
}

/**
 * Mirrors the `prefers-reduced-motion` media query onto `target` via
 * `REDUCED_MOTION_CLASS`, and keeps it in sync until the returned cleanup runs.
 * Use this for animations owned by non-React code (canvas, third-party widgets).
 */
export function observeReducedMotion(
  target: HTMLElement,
  onChange?: (reduced: boolean) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  const apply = (reduced: boolean) => {
    target.classList.toggle(REDUCED_MOTION_CLASS, reduced);
    onChange?.(reduced);
  };
  apply(mql.matches);
  const listener = (event: MediaQueryListEvent) => apply(event.matches);
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }
  mql.addListener(listener);
  return () => mql.removeListener(listener);
}

export default useReducedMotion;
