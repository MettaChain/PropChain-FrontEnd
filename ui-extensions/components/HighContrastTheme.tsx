'use client';

import React, { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { highContrastStyle, type HighContrastBaseTheme } from './highContrastTheme';

/**
 * High contrast theme provider for extension components (#1365).
 *
 * The theme is scoped to a wrapper rather than applied globally, so extensions
 * rendered inside the main app cannot change the host page's colours. Styles
 * live in `ui-extensions/styles/high-contrast.css`; the palette itself is
 * exported from `highContrastTheme.ts` for tests and inline overrides.
 */

export const HIGH_CONTRAST_STORAGE_KEY = 'propchain:high-contrast';
export const HIGH_CONTRAST_ROOT_CLASS = 'hc-root';

export interface UseHighContrastThemeOptions {
  /** Seed the toggle before stored/system state is read. Defaults to false. */
  defaultEnabled?: boolean;
  /** `localStorage` key used to persist the choice. Pass `null` to disable persistence. */
  storageKey?: string | null;
  /** Follow the OS `prefers-contrast: more` setting on first visit. Defaults to true. */
  respectSystemPreference?: boolean;
}

export interface HighContrastThemeState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  /** True when the OS asks for more contrast. */
  systemPrefersHighContrast: boolean;
}

function systemPrefersContrast(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Persisted high-contrast toggle. Rendering is SSR-safe: storage and media
 * queries are only read after mount.
 */
export function useHighContrastTheme({
  defaultEnabled = false,
  storageKey = HIGH_CONTRAST_STORAGE_KEY,
  respectSystemPreference = true,
}: UseHighContrastThemeOptions = {}): HighContrastThemeState {
  const [enabled, setEnabledState] = useState(defaultEnabled);
  const [systemPrefers, setSystemPrefers] = useState(false);

  useEffect(() => {
    const prefers = systemPrefersContrast();
    setSystemPrefers(prefers);

    const stored = storageKey ? window.localStorage?.getItem(storageKey) : null;
    if (stored !== null && stored !== undefined) setEnabledState(stored === 'true');
    else if (respectSystemPreference && prefers) setEnabledState(true);

    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-contrast: more)');
    const onChange = (event: MediaQueryListEvent) => setSystemPrefers(event.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [storageKey, respectSystemPreference]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      if (storageKey) {
        try {
          window.localStorage?.setItem(storageKey, String(next));
        } catch {
          // Private-mode/storage-disabled: the preference simply is not persisted.
        }
      }
    },
    [storageKey],
  );

  const toggle = useCallback(() => setEnabled(!enabled), [setEnabled, enabled]);

  return { enabled, setEnabled, toggle, systemPrefersHighContrast: systemPrefers };
}

export interface HighContrastThemeProps {
  /** Render children with the high contrast palette. Defaults to true. */
  enabled?: boolean;
  /** Base theme the palette is tuned for. Defaults to `light`. */
  baseTheme?: HighContrastBaseTheme;
  /** Inline the custom properties in addition to relying on the stylesheet. */
  inlineStyles?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Scoped high contrast wrapper. Adds `hc-root` plus the custom properties so
 * descendants can be styled by `high-contrast.css` or `var(--hc-*)` directly.
 */
export function HighContrastTheme({
  enabled = true,
  baseTheme = 'light',
  inlineStyles = false,
  className = '',
  style,
  children,
}: HighContrastThemeProps) {
  if (!enabled) return <>{children}</>;

  const paletteVars = (inlineStyles ? highContrastStyle(baseTheme) : {}) as Record<string, string>;

  return (
    <div
      className={[HIGH_CONTRAST_ROOT_CLASS, className].filter(Boolean).join(' ')}
      data-hc-theme="high"
      data-hc-base={baseTheme}
      style={{ ...(paletteVars as CSSProperties), ...style }}
    >
      {children}
    </div>
  );
}

export default HighContrastTheme;
