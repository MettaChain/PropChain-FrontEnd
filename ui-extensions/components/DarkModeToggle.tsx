'use client';

import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DarkModeToggleProps {
  initialMode?: ThemeMode;
  transitionDurationMs?: number;
}

const nextMode: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export function DarkModeToggle({
  initialMode = 'system',
  transitionDurationMs = 200,
}: DarkModeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => setMode(initialMode), [initialMode]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  const duration = Number.isFinite(transitionDurationMs)
    ? Math.max(0, transitionDurationMs)
    : 200;

  return (
    <section
      className={`w-full max-w-sm rounded-xl border p-5 shadow-sm transition-colors ${isDark
        ? 'border-slate-700 bg-slate-900 text-white'
        : 'border-slate-200 bg-white text-slate-900'}`}
      style={{ transitionDuration: `${duration}ms` }}
      data-theme={mode}
      aria-label="Appearance settings"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Appearance</h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Current mode: {mode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode((current) => nextMode[current])}
          aria-label={`Change theme mode. Current mode: ${mode}`}
          aria-pressed={isDark}
          className="rounded-lg border border-current px-4 py-2 text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ transitionDuration: `${duration}ms` }}
        >
          {isDark ? 'Dark' : 'Light'}
        </button>
      </div>
      <p className={`mt-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Activate the button to cycle through light, dark, and system preferences.
      </p>
    </section>
  );
}

export default DarkModeToggle;
