import { act, renderHook } from '@testing-library/react';

import {
  motionDuration,
  observeReducedMotion,
  prefersReducedMotion,
  REDUCED_MOTION_CLASS,
  REDUCED_MOTION_QUERY,
  reducedMotionClass,
  useReducedMotion,
  useReducedMotionClass,
} from '../hooks/useReducedMotion';

type Listener = (event: MediaQueryListEvent) => void;

/** Controllable `matchMedia` stub that lets a test flip the preference. */
function installMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    media: REDUCED_MOTION_QUERY,
    onchange: null,
    addEventListener: jest.fn((_: string, listener: Listener) => listeners.add(listener)),
    removeEventListener: jest.fn((_: string, listener: Listener) => listeners.delete(listener)),
    addListener: jest.fn((listener: Listener) => listeners.add(listener)),
    removeListener: jest.fn((listener: Listener) => listeners.delete(listener)),
    dispatchEvent: jest.fn(() => false),
  };

  const matchMedia = jest.fn(() => mql);
  // `jest.setup.js` defines matchMedia as writable but not configurable, so it
  // must be replaced by assignment rather than Object.defineProperty.
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

  return {
    mql,
    matchMedia,
    change(next: boolean) {
      mql.matches = next;
      act(() => {
        listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
      });
    },
    listenerCount: () => listeners.size,
  };
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('prefersReducedMotion', () => {
  it('reflects the media query result', () => {
    installMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);

    installMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('queries the reduced motion media query', () => {
    const { matchMedia } = installMatchMedia(false);
    prefersReducedMotion();
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it('returns false when matchMedia is unavailable', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('useReducedMotion', () => {
  it('returns the current preference and reacts to changes', () => {
    const media = installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    media.change(false);
    expect(result.current).toBe(false);

    media.change(true);
    expect(result.current).toBe(true);
  });

  it('opens one listener and removes it on unmount', () => {
    const media = installMatchMedia(false);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(media.listenerCount()).toBe(1);

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it('falls back to the deprecated listener API when addEventListener is missing', () => {
    const listeners = new Set<Listener>();
    const mql: Record<string, unknown> = {
      matches: true,
      media: REDUCED_MOTION_QUERY,
      onchange: null,
      addListener: (listener: Listener) => listeners.add(listener),
      removeListener: (listener: Listener) => listeners.delete(listener),
      dispatchEvent: () => false,
    };
    window.matchMedia = jest.fn(() => mql) as unknown as typeof window.matchMedia;

    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(listeners.size).toBe(1);

    unmount();
    expect(listeners.size).toBe(0);
  });
});

describe('reduced motion helpers', () => {
  it('exposes a CSS class name', () => {
    expect(REDUCED_MOTION_CLASS).toBe('motion-reduced');
    expect(reducedMotionClass(true)).toBe('motion-reduced');
    expect(reducedMotionClass(false)).toBe('');
  });

  it('collapses durations to zero when motion is reduced', () => {
    expect(motionDuration(true, 300)).toBe(0);
    expect(motionDuration(false, 300)).toBe(300);
  });

  it('merges the class through the hook', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotionClass('card shadow'));
    expect(result.current).toBe('card shadow motion-reduced');
  });
});

describe('observeReducedMotion', () => {
  it('toggles the class on the target and reports changes', () => {
    const media = installMatchMedia(false);
    const target = document.createElement('div');
    const onChange = jest.fn();

    const stop = observeReducedMotion(target, onChange);
    expect(target).not.toHaveClass(REDUCED_MOTION_CLASS);
    expect(onChange).toHaveBeenLastCalledWith(false);

    media.change(true);
    expect(target).toHaveClass(REDUCED_MOTION_CLASS);
    expect(onChange).toHaveBeenLastCalledWith(true);

    media.change(false);
    expect(target).not.toHaveClass(REDUCED_MOTION_CLASS);

    stop();
    expect(media.listenerCount()).toBe(0);
  });

  it('is a no-op when matchMedia is unavailable', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    const target = document.createElement('div');
    const stop = observeReducedMotion(target);
    expect(target.className).toBe('');
    expect(() => stop()).not.toThrow();
  });
});
