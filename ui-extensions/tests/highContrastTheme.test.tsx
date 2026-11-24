import { act, render, renderHook, screen } from '@testing-library/react';

import HighContrastTheme, {
  HIGH_CONTRAST_ROOT_CLASS,
  HIGH_CONTRAST_STORAGE_KEY,
  useHighContrastTheme,
} from '../components/HighContrastTheme';
import {
  HIGH_CONTRAST_BY_BASE,
  HIGH_CONTRAST_LIGHT,
  HIGH_CONTRAST_MIN_RATIO,
  HIGH_CONTRAST_PAIRS,
  highContrastPairs,
  highContrastStyle,
} from '../components/highContrastTheme';
import { checkContrast } from '../utils/searchA11yUtils';

const originalMatchMedia = window.matchMedia;

function stubContrastMedia(matches: boolean) {
  // `jest.setup.js` defines matchMedia as writable but not configurable.
  window.matchMedia = jest.fn((query: string) => ({
    matches: query === '(prefers-contrast: more)' ? matches : false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(() => false),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  jest.restoreAllMocks();
  // jsdom keeps localStorage per origin for the whole file, so state written by
  // one test would otherwise leak into the next.
  window.localStorage.clear();
  stubContrastMedia(false);
});

afterEach(() => {
  jest.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
});

describe('high contrast palette', () => {
  it('requires a 7:1 minimum ratio', () => {
    expect(HIGH_CONTRAST_MIN_RATIO).toBe(7);
  });

  it.each(['light', 'dark'] as const)('meets 7:1 for every pair on the %s base theme', (theme) => {
    const pairs = highContrastPairs(theme);
    expect(pairs).toHaveLength(HIGH_CONTRAST_PAIRS.length);

    for (const pair of pairs) {
      const { ratio } = checkContrast(pair.fg, pair.bg);
      expect({ label: pair.label, ratio }).toEqual({
        label: pair.label,
        ratio: expect.any(Number),
      });
      if (ratio < HIGH_CONTRAST_MIN_RATIO) {
        throw new Error(`${theme}/${pair.label}: ${pair.fg} on ${pair.bg} is only ${ratio}:1`);
      }
    }
  });

  it('uses different colours for the light and dark base themes', () => {
    expect(HIGH_CONTRAST_LIGHT.background).not.toBe(HIGH_CONTRAST_BY_BASE.dark.background);
    expect(HIGH_CONTRAST_LIGHT.foreground).not.toBe(HIGH_CONTRAST_BY_BASE.dark.foreground);
  });

  it('exposes CSS custom properties for both base themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      const style = highContrastStyle(theme);
      expect(Object.keys(style)).toEqual(
        expect.arrayContaining([
          '--hc-background',
          '--hc-foreground',
          '--hc-muted-foreground',
          '--hc-border',
          '--hc-focus-ring',
          '--hc-accent',
          '--hc-accent-foreground',
          '--hc-danger',
          '--hc-success',
          '--hc-input-background',
        ]),
      );
    }
  });
});

describe('HighContrastTheme', () => {
  it('scopes the palette to a wrapper with data attributes', () => {
    render(
      <HighContrastTheme baseTheme="dark">
        <button type="button">Confirm</button>
      </HighContrastTheme>,
    );

    const wrapper = screen.getByText('Confirm').parentElement as HTMLElement;
    expect(wrapper).toHaveClass(HIGH_CONTRAST_ROOT_CLASS);
    expect(wrapper).toHaveAttribute('data-hc-theme', 'high');
    expect(wrapper).toHaveAttribute('data-hc-base', 'dark');
  });

  it('renders children unchanged when disabled', () => {
    render(
      <HighContrastTheme enabled={false}>
        <button type="button">Plain</button>
      </HighContrastTheme>,
    );

    const button = screen.getByRole('button', { name: 'Plain' });
    expect(button.closest('[data-hc-theme]')).toBeNull();
    expect(button.parentElement).not.toHaveClass(HIGH_CONTRAST_ROOT_CLASS);
  });

  it('inlines custom properties when requested', () => {
    render(
      <HighContrastTheme baseTheme="light" inlineStyles>
        <span>Text</span>
      </HighContrastTheme>,
    );

    const wrapper = screen.getByText('Text').parentElement as HTMLElement;
    expect(wrapper.style.getPropertyValue('--hc-background')).toBe('#ffffff');
    expect(wrapper.style.getPropertyValue('--hc-foreground')).toBe('#000000');
  });
});

describe('useHighContrastTheme', () => {
  it('starts disabled when nothing is stored and the system does not ask for contrast', () => {
    stubContrastMedia(false);
    const { result } = renderHook(() => useHighContrastTheme());

    expect(result.current.enabled).toBe(false);
    expect(result.current.systemPrefersHighContrast).toBe(false);
  });

  it('honours the OS prefers-contrast setting on first visit', () => {
    stubContrastMedia(true);
    const { result } = renderHook(() => useHighContrastTheme());

    expect(result.current.systemPrefersHighContrast).toBe(true);
    expect(result.current.enabled).toBe(true);
  });

  it('reads a stored preference over the OS setting', () => {
    stubContrastMedia(true);
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('false');

    const { result } = renderHook(() => useHighContrastTheme());
    expect(result.current.enabled).toBe(false);
    expect(getItem).toHaveBeenCalledWith(HIGH_CONTRAST_STORAGE_KEY);
  });

  it('toggles and persists the choice', () => {
    stubContrastMedia(false);
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
    const { result } = renderHook(() => useHighContrastTheme());

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
    expect(setItem).toHaveBeenLastCalledWith(HIGH_CONTRAST_STORAGE_KEY, 'true');

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(setItem).toHaveBeenLastCalledWith(HIGH_CONTRAST_STORAGE_KEY, 'false');
  });

  it('supports an explicit setter and a disabled storage key', () => {
    stubContrastMedia(false);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useHighContrastTheme({ storageKey: null }));

    act(() => result.current.setEnabled(true));
    expect(result.current.enabled).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('does not auto-enable from the system when respectSystemPreference is false', () => {
    stubContrastMedia(true);
    const { result } = renderHook(() => useHighContrastTheme({ respectSystemPreference: false }));

    expect(result.current.systemPrefersHighContrast).toBe(true);
    expect(result.current.enabled).toBe(false);
  });
});
